import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { listProducts, createProduct, updateProduct } from "@/api/products";
import type { Product } from "@/api/types";
import { ApiError } from "@/api/client";
import { TextField } from "@/components/TextField";
import { PrimaryButton } from "@/components/PrimaryButton";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { colors, spacing } from "@/theme";

export default function ProductsScreen() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["products"], queryFn: listProducts });
  const [editing, setEditing] = useState<Product | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const products = data?.products ?? [];

  const openAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (product: Product) => {
    setEditing(product);
    setFormOpen(true);
  };
  const closeForm = () => setFormOpen(false);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["products"] });

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
      <View style={styles.header}>
        <Text style={styles.count}>{products.length} product{products.length === 1 ? "" : "s"}</Text>
        <PrimaryButton title="+ Add Product" onPress={openAdd} />
      </View>

      {isLoading ? (
        <Text style={styles.muted}>Loading…</Text>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={styles.muted}>No products yet. Add your first one.</Text>}
          renderItem={({ item }) => (
            <Pressable style={styles.row} onPress={() => openEdit(item)}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{item.name}</Text>
                <Text style={styles.muted}>Barcode: {item.barcode}</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.rowPrice}>Ksh {item.sellPrice}</Text>
                <Text style={[styles.muted, item.currentStock === 0 && styles.outOfStock]}>
                  {item.currentStock} in stock
                </Text>
              </View>
            </Pressable>
          )}
        />
      )}

      <Modal visible={formOpen} animationType="slide" onRequestClose={closeForm}>
        <ProductForm
          product={editing}
          onDone={() => {
            invalidate();
            closeForm();
          }}
          onCancel={closeForm}
        />
      </Modal>
    </SafeAreaView>
  );
}

function ProductForm({
  product,
  onDone,
  onCancel,
}: {
  product: Product | null;
  onDone: () => void;
  onCancel: () => void;
}) {
  const isEdit = Boolean(product);
  const [name, setName] = useState(product?.name ?? "");
  const [barcode, setBarcode] = useState(product?.barcode ?? "");
  const [costPrice, setCostPrice] = useState(product?.costPrice ?? "");
  const [sellPrice, setSellPrice] = useState(product?.sellPrice ?? "");
  const [category, setCategory] = useState(product?.category ?? "");
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: onDone,
    onError: (err) => setError(err instanceof ApiError ? err.message : "Could not save product."),
  });
  const updateMutation = useMutation({
    mutationFn: (data: Parameters<typeof updateProduct>[1]) => updateProduct(product!.id, data),
    onSuccess: onDone,
    onError: (err) => setError(err instanceof ApiError ? err.message : "Could not save product."),
  });

  const saving = createMutation.isPending || updateMutation.isPending;

  const handleSave = () => {
    setError(null);
    const cost = Number(costPrice);
    const sell = Number(sellPrice);
    if (!name.trim() || !barcode.trim() || Number.isNaN(cost) || Number.isNaN(sell)) {
      setError("Fill in name, barcode, cost price, and sell price.");
      return;
    }
    if (isEdit) {
      updateMutation.mutate({ name: name.trim(), costPrice: cost, sellPrice: sell, category: category.trim() || null });
    } else {
      createMutation.mutate({
        name: name.trim(),
        barcode: barcode.trim(),
        costPrice: cost,
        sellPrice: sell,
        category: category.trim() || undefined,
      });
    }
  };

  if (scanning) {
    return (
      <BarcodeScanner
        onScanned={(code) => {
          setBarcode(code);
          setScanning(false);
        }}
        onClose={() => setScanning(false)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.formContent}>
        <Text style={styles.formTitle}>{isEdit ? "Edit Product" : "Add Product"}</Text>

        <TextField label="Name" value={name} onChangeText={setName} placeholder="e.g. Coca-Cola 500ml" />

        <View style={styles.barcodeRow}>
          <View style={{ flex: 1 }}>
            <TextField
              label="Barcode"
              value={barcode}
              onChangeText={setBarcode}
              placeholder="Scan or type"
              editable={!isEdit}
            />
          </View>
          {!isEdit && (
            <PrimaryButton title="Scan" onPress={() => setScanning(true)} variant="outline" />
          )}
        </View>

        <TextField label="Cost Price (Ksh)" value={String(costPrice)} onChangeText={setCostPrice} keyboardType="decimal-pad" />
        <TextField label="Sell Price (Ksh)" value={String(sellPrice)} onChangeText={setSellPrice} keyboardType="decimal-pad" />
        <TextField label="Category (optional)" value={category ?? ""} onChangeText={setCategory} placeholder="e.g. Drinks" />

        {error && <Text style={styles.error}>{error}</Text>}

        <PrimaryButton title={isEdit ? "Save Changes" : "Add Product"} onPress={handleSave} loading={saving} />
        <PrimaryButton title="Cancel" onPress={onCancel} variant="outline" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.lg,
    gap: spacing.md,
  },
  count: { color: colors.textMuted, fontWeight: "600" },
  muted: { color: colors.textMuted, padding: spacing.lg },
  error: { color: colors.danger },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, gap: spacing.sm },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  rowTitle: { fontWeight: "700", color: colors.text, fontSize: 15 },
  rowPrice: { fontWeight: "800", color: colors.text },
  outOfStock: { color: colors.danger, fontWeight: "700" },
  formContent: { padding: spacing.lg, gap: spacing.md },
  formTitle: { fontSize: 20, fontWeight: "800", color: colors.text },
  barcodeRow: { flexDirection: "row", alignItems: "flex-end", gap: spacing.sm },
});
