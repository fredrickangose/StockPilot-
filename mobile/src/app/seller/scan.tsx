import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getProductByBarcode } from "@/api/products";
import { createSale } from "@/api/sales";
import type { Product } from "@/api/types";
import { ApiError } from "@/api/client";
import { useAuth } from "@/auth/AuthContext";
import { Screen } from "@/components/Screen";
import { TextField } from "@/components/TextField";
import { PrimaryButton } from "@/components/PrimaryButton";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { colors, spacing } from "@/theme";

export default function ScanScreen() {
  const queryClient = useQueryClient();
  const { logout } = useAuth();
  const [scanning, setScanning] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState("1");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);

  const saleMutation = useMutation({
    mutationFn: createSale,
    onSuccess: (res) => {
      setSuccess(`Sold ${res.sale.quantity} x ${product?.name} for Ksh ${res.sale.totalAmount}.`);
      setProduct(null);
      setQuantity("1");
      queryClient.invalidateQueries({ queryKey: ["sales"] });
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "Could not record sale."),
  });

  const handleScanned = async (code: string) => {
    setScanning(false);
    setError(null);
    setSuccess(null);
    setLookupLoading(true);
    try {
      const res = await getProductByBarcode(code);
      setProduct(res.product);
      setQuantity("1");
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
        <Text style={styles.title}>Scan to Sell</Text>
        <Text style={styles.subtitle}>Scan a product's barcode to record a sale.</Text>

        <PrimaryButton title="Scan Barcode" onPress={() => { setScanning(true); setSuccess(null); }} loading={lookupLoading} />

        {success && <Text style={styles.success}>{success}</Text>}
        {error && !product && <Text style={styles.error}>{error}</Text>}

        {product && (
          <View style={styles.card}>
            <Text style={styles.productName}>{product.name}</Text>
            <Text style={styles.muted}>Ksh {product.sellPrice} each &middot; {product.currentStock} in stock</Text>

            <TextField label="Quantity" keyboardType="number-pad" value={quantity} onChangeText={setQuantity} />

            {error && <Text style={styles.error}>{error}</Text>}

            <PrimaryButton title="Confirm Sale" onPress={handleSubmit} loading={saleMutation.isPending} />
          </View>
        )}

        <PrimaryButton title="Sign Out" onPress={logout} variant="outline" />
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
