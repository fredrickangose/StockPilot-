import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { getProductByBarcode } from "@/api/products";
import { createRestock } from "@/api/restocks";
import type { Product } from "@/api/types";
import { ApiError } from "@/api/client";
import { Screen } from "@/components/Screen";
import { TextField } from "@/components/TextField";
import { PrimaryButton } from "@/components/PrimaryButton";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { Card } from "@/components/Card";
import { colors, radii, spacing, typography } from "@/theme";

export default function RestockScreen() {
  const queryClient = useQueryClient();
  const [scanning, setScanning] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState("");
  const [costPerUnit, setCostPerUnit] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);

  const restockMutation = useMutation({
    mutationFn: createRestock,
    onSuccess: (res) => {
      setSuccess(`Added ${res.restock.quantity} units. New stock: ${res.product.currentStock}.`);
      setProduct(null);
      setQuantity("");
      setCostPerUnit("");
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "Could not record restock."),
  });

  const handleScanned = async (code: string) => {
    setScanning(false);
    setError(null);
    setSuccess(null);
    setLookupLoading(true);
    try {
      const res = await getProductByBarcode(code);
      setProduct(res.product);
      setCostPerUnit(res.product.costPrice);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not find that product.");
    } finally {
      setLookupLoading(false);
    }
  };

  const handleSubmit = () => {
    if (!product) return;
    setError(null);
    const qty = Number(quantity);
    const cost = Number(costPerUnit);
    if (!Number.isInteger(qty) || qty <= 0 || Number.isNaN(cost) || cost < 0) {
      setError("Enter a valid quantity and cost per unit.");
      return;
    }
    restockMutation.mutate({ productId: product.id, quantity: qty, costPerUnit: cost });
  };

  if (scanning) {
    return <BarcodeScanner onScanned={handleScanned} onClose={() => setScanning(false)} />;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
      <Screen>
        <View>
          <Text style={styles.title}>Restock</Text>
          <Text style={styles.subtitle}>Scan a product's barcode to add new stock.</Text>
        </View>

        <PrimaryButton
          title="Scan Barcode"
          onPress={() => {
            setScanning(true);
            setSuccess(null);
          }}
          loading={lookupLoading}
          icon="scan"
        />

        {success && (
          <View style={styles.successBox}>
            <Ionicons name="checkmark-circle" size={18} color={colors.success} />
            <Text style={styles.successText}>{success}</Text>
          </View>
        )}
        {error && !product && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={16} color={colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {product && (
          <Card style={{ gap: spacing.sm }}>
            <View style={styles.productHead}>
              <View style={styles.productIcon}>
                <Ionicons name="cube" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.muted}>Current stock: {product.currentStock}</Text>
              </View>
            </View>

            <TextField label="Quantity Added" icon="add-circle" keyboardType="number-pad" value={quantity} onChangeText={setQuantity} placeholder="e.g. 20" />
            <TextField label="Cost Per Unit (Ksh)" icon="cash" keyboardType="decimal-pad" value={costPerUnit} onChangeText={setCostPerUnit} />

            {error && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color={colors.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <PrimaryButton title="Record Restock" onPress={handleSubmit} loading={restockMutation.isPending} icon="checkmark" />
          </Card>
        )}
      </Screen>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  title: { ...typography.title, color: colors.text },
  subtitle: { ...typography.subtitle, color: colors.textMuted },
  muted: { color: colors.textMuted, fontSize: 13 },
  successBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.successLight,
    padding: spacing.sm,
    borderRadius: 8,
  },
  successText: { color: colors.success, fontWeight: "700", flex: 1, fontSize: 13 },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.dangerLight,
    padding: spacing.sm,
    borderRadius: 8,
  },
  errorText: { color: colors.danger, fontSize: 13, fontWeight: "600", flex: 1 },
  productHead: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  productIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.sm,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  productName: { fontSize: 16, fontWeight: "800", color: colors.text },
});
