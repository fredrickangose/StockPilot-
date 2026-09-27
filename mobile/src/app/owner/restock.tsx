import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getProductByBarcode } from "@/api/products";
import { createRestock } from "@/api/restocks";
import type { Product } from "@/api/types";
import { ApiError } from "@/api/client";
import { Screen } from "@/components/Screen";
import { TextField } from "@/components/TextField";
import { PrimaryButton } from "@/components/PrimaryButton";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { colors, spacing } from "@/theme";

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
      setSuccess(
        `Added ${res.restock.quantity} units. New stock: ${res.product.currentStock}.`
      );
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
        <Text style={styles.title}>Restock</Text>
        <Text style={styles.subtitle}>Scan a product's barcode to add new stock.</Text>

        <PrimaryButton title="Scan Barcode" onPress={() => { setScanning(true); setSuccess(null); }} loading={lookupLoading} />

        {success && <Text style={styles.success}>{success}</Text>}
        {error && !product && <Text style={styles.error}>{error}</Text>}

        {product && (
          <View style={styles.card}>
            <Text style={styles.productName}>{product.name}</Text>
            <Text style={styles.muted}>Current stock: {product.currentStock}</Text>

            <TextField label="Quantity Added" keyboardType="number-pad" value={quantity} onChangeText={setQuantity} placeholder="e.g. 20" />
            <TextField label="Cost Per Unit (Ksh)" keyboardType="decimal-pad" value={costPerUnit} onChangeText={setCostPerUnit} />

            {error && <Text style={styles.error}>{error}</Text>}

            <PrimaryButton title="Record Restock" onPress={handleSubmit} loading={restockMutation.isPending} />
          </View>
        )}
      </Screen>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  title: { fontSize: 24, fontWeight: "800", color: colors.text },
  subtitle: { color: colors.textMuted },
  success: { color: colors.success, fontWeight: "600" },
  error: { color: colors.danger },
  muted: { color: colors.textMuted },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  productName: { fontSize: 18, fontWeight: "800", color: colors.text },
});
