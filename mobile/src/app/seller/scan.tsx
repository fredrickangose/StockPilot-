import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { getProductByBarcode } from "@/api/products";
import { createSale } from "@/api/sales";
import type { Product } from "@/api/types";
import { ApiError } from "@/api/client";
import { useAuth } from "@/auth/AuthContext";
import { Screen } from "@/components/Screen";
import { TextField } from "@/components/TextField";
import { PrimaryButton } from "@/components/PrimaryButton";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { Card } from "@/components/Card";
import { colors, radii, spacing, typography } from "@/theme";

export default function ScanScreen() {
  const queryClient = useQueryClient();
  const { user, logout } = useAuth();
  const [scanning, setScanning] = useState(false);
  const [manualBarcode, setManualBarcode] = useState("");
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState("1");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);

  const saleMutation = useMutation({
    mutationFn: createSale,
    onSuccess: (res) => {
      setSuccess(`Sold ${res.sale.quantity} x ${product?.name} for Ksh ${Number(res.sale.totalAmount).toLocaleString()}.`);
      setProduct(null);
      setQuantity("1");
      setManualBarcode("");
      queryClient.invalidateQueries({ queryKey: ["sales"] });
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "Could not record sale."),
  });

  const lookupBarcode = async (code: string) => {
    if (!code.trim()) return;
    setError(null);
    setSuccess(null);
    setLookupLoading(true);
    try {
      const res = await getProductByBarcode(code.trim());
      setProduct(res.product);
      setQuantity("1");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not find that product.");
    } finally {
      setLookupLoading(false);
    }
  };

  const handleScanned = (code: string) => {
    setScanning(false);
    lookupBarcode(code);
  };

  const handleSubmit = () => {
    if (!product) return;
    setError(null);
    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty <= 0) {
      setError("Enter a valid quantity.");
      return;
    }
    if (qty > product.currentStock) {
      setError(`Only ${product.currentStock} in stock.`);
      return;
    }
    saleMutation.mutate({ productId: product.id, quantity: qty });
  };

  if (scanning) {
    return <BarcodeScanner onScanned={handleScanned} onClose={() => setScanning(false)} />;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
      <Screen>
        <View>
          <Text style={styles.greeting}>Hi, {user?.name?.split(" ")[0]}</Text>
          <Text style={styles.title}>Scan to Sell</Text>
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

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.manualRow}>
          <View style={{ flex: 1 }}>
            <TextField
              label="Barcode"
              icon="barcode"
              value={manualBarcode}
              onChangeText={setManualBarcode}
              placeholder="Type or use a USB scanner"
              onSubmitEditing={() => lookupBarcode(manualBarcode)}
              returnKeyType="search"
            />
          </View>
          <PrimaryButton title="Look Up" onPress={() => lookupBarcode(manualBarcode)} variant="outline" icon="search" />
        </View>

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
                <Text style={styles.muted}>
                  Ksh {Number(product.sellPrice).toLocaleString()} each &middot; {product.currentStock} in stock
                </Text>
              </View>
            </View>

            <TextField label="Quantity" icon="calculator" keyboardType="number-pad" value={quantity} onChangeText={setQuantity} />

            {error && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color={colors.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <PrimaryButton title="Confirm Sale" onPress={handleSubmit} loading={saleMutation.isPending} icon="checkmark-circle" />
          </Card>
        )}

        <PrimaryButton title="Sign Out" onPress={logout} variant="ghost" icon="log-out-outline" />
      </Screen>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  greeting: { ...typography.caption, color: colors.textMuted },
  title: { ...typography.title, color: colors.text },
  muted: { color: colors.textMuted, fontSize: 13 },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { color: colors.textFaint, fontSize: 12, fontWeight: "700" },
  manualRow: { flexDirection: "row", alignItems: "flex-end", gap: spacing.sm },
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
