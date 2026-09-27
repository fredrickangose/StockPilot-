import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { listProducts, createProduct, updateProduct } from "@/api/products";
import type { Product } from "@/api/types";
import { ApiError } from "@/api/client";
import { TextField } from "@/components/TextField";
import { PrimaryButton } from "@/components/PrimaryButton";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { FormModal } from "@/components/FormModal";
import { colors, radii, spacing, typography } from "@/theme";

export default function ProductsScreen() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["products"], queryFn: listProducts });
  const [editing, setEditing] = useState<Product | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");

  const products = data?.products ?? [];

  const categories = useMemo(() => {
    const distinct = new Set<string>();
    let hasUncategorized = false;
    for (const product of products) {
      if (product.category?.trim()) {
        distinct.add(product.category.trim());
      } else {
        hasUncategorized = true;
      }
    }
    const sorted = Array.from(distinct).sort((a, b) => a.localeCompare(b));
    return ["All", ...sorted, ...(hasUncategorized ? ["Uncategorized"] : [])];
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (selectedCategory === "All") return products;
    return products.filter((product) => (product.category?.trim() || "Uncategorized") === selectedCategory);
  }, [products, selectedCategory]);

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
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Products</Text>
          <Text style={styles.count}>
            {filteredProducts.length} product{filteredProducts.length === 1 ? "" : "s"}
            {selectedCategory !== "All" ? ` in ${selectedCategory}` : ""}
          </Text>
        </View>
        <PrimaryButton title="Add" onPress={openAdd} icon="add" size="sm" />
      </View>

      {categories.length > 2 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {categories.map((category) => {
            const active = category === selectedCategory;
            return (
              <Pressable
                key={category}
                onPress={() => setSelectedCategory(category)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{category}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {isLoading ? (
        <Text style={styles.muted}>Loading…</Text>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <EmptyState
              icon="cube-outline"
              title={selectedCategory === "All" ? "No products yet" : `No products in ${selectedCategory}`}
              subtitle={
                selectedCategory === "All"
                  ? "Add your first product and give it a barcode to start tracking stock."
                  : "Try a different category, or add one here."
              }
            />
          }
          renderItem={({ item }) => (
            <Pressable onPress={() => openEdit(item)}>
              <Card style={styles.row}>
                <View style={styles.rowIcon}>
                  <Ionicons name="cube" size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.muted}>
                    #{item.barcode}
                    {item.category ? ` · ${item.category}` : ""}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end", gap: 4 }}>
                  <Text style={styles.rowPrice}>Ksh {Number(item.sellPrice).toLocaleString()}</Text>
                  <Badge
                    label={`${item.currentStock} in stock`}
                    tone={item.currentStock === 0 ? "danger" : item.currentStock < 5 ? "accent" : "success"}
                  />
                </View>
              </Card>
            </Pressable>
          )}
        />
      )}

      <FormModal visible={formOpen} onRequestClose={closeForm}>
        <ProductForm
          product={editing}
          onDone={() => {
            invalidate();
            closeForm();
          }}
          onCancel={closeForm}
        />
      </FormModal>
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
      <View style={styles.formHeader}>
        <Pressable onPress={onCancel} hitSlop={12}>
          <Ionicons name="close" size={24} color={colors.textMuted} />
        </Pressable>
        <Text style={styles.formTitle}>{isEdit ? "Edit Product" : "Add Product"}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled">
        <TextField label="Name" icon="pricetag" value={name} onChangeText={setName} placeholder="e.g. Coca-Cola 500ml" />

        <View style={styles.barcodeRow}>
          <View style={{ flex: 1 }}>
            <TextField
              label="Barcode"
              icon="barcode"
              value={barcode}
              onChangeText={setBarcode}
              placeholder="Scan or type"
              editable={!isEdit}
            />
          </View>
          {!isEdit && (
            <PrimaryButton title="Scan" onPress={() => setScanning(true)} variant="outline" icon="scan" />
          )}
        </View>

        <View style={styles.priceRow}>
          <View style={{ flex: 1 }}>
            <TextField label="Cost Price" icon="cash" value={String(costPrice)} onChangeText={setCostPrice} keyboardType="decimal-pad" />
          </View>
          <View style={{ flex: 1 }}>
            <TextField label="Sell Price" icon="cash-outline" value={String(sellPrice)} onChangeText={setSellPrice} keyboardType="decimal-pad" />
          </View>
        </View>

        <TextField label="Category (optional)" icon="grid" value={category ?? ""} onChangeText={setCategory} placeholder="e.g. Drinks" />

        {error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={16} color={colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <PrimaryButton title={isEdit ? "Save Changes" : "Add Product"} onPress={handleSave} loading={saving} icon="checkmark" />
      </ScrollView>
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
  headerTitle: { ...typography.title, color: colors.text },
  count: { color: colors.textMuted, fontWeight: "600", fontSize: 13 },
  muted: { color: colors.textMuted, fontSize: 13 },
  chipRow: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md, gap: spacing.xs },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, fontWeight: "700", color: colors.textMuted },
  chipTextActive: { color: colors.white },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, gap: spacing.sm },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.sm,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  rowTitle: { fontWeight: "700", color: colors.text, fontSize: 15 },
  rowPrice: { fontWeight: "800", color: colors.text },
  formHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  formTitle: { fontSize: 17, fontWeight: "800", color: colors.text },
  formContent: { padding: spacing.lg, gap: spacing.md },
  barcodeRow: { flexDirection: "row", alignItems: "flex-end", gap: spacing.sm },
  priceRow: { flexDirection: "row", gap: spacing.sm },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.dangerLight,
    padding: spacing.sm,
    borderRadius: 8,
  },
  errorText: { color: colors.danger, fontSize: 13, fontWeight: "600", flex: 1 },
});
