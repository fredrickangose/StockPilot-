import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { listMySales } from "@/api/sales";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { colors, radii, spacing, typography } from "@/theme";

export default function MySalesScreen() {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["sales"],
    queryFn: listMySales,
  });

  const sales = useMemo(
    () => (data?.sales ?? []).slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [data]
  );

  const total = useMemo(() => sales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0), [sales]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <View style={styles.totalIcon}>
          <Ionicons name="trending-up" size={20} color={colors.success} />
        </View>
        <View>
          <Text style={styles.totalLabel}>Your total sales</Text>
          <Text style={styles.totalValue}>Ksh {total.toLocaleString()}</Text>
        </View>
      </View>

      {isLoading ? (
        <Text style={styles.muted}>Loading…</Text>
      ) : (
        <FlatList
          data={sales}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
          ListEmptyComponent={
            <EmptyState icon="receipt-outline" title="No sales yet" subtitle="Scan a barcode to record your first sale." />
          }
          renderItem={({ item }) => (
            <Card style={styles.row}>
              <View style={styles.rowIcon}>
                <Ionicons name="receipt" size={16} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{item.quantity} unit{item.quantity === 1 ? "" : "s"}</Text>
                <Text style={styles.muted}>{new Date(item.createdAt).toLocaleString()}</Text>
              </View>
              <Text style={styles.rowAmount}>Ksh {Number(item.totalAmount).toLocaleString()}</Text>
            </Card>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: "row", alignItems: "center", gap: spacing.sm, padding: spacing.lg },
  totalIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.successLight,
    alignItems: "center",
    justifyContent: "center",
  },
  totalLabel: { ...typography.caption, color: colors.textMuted },
  totalValue: { fontSize: 28, fontWeight: "800", color: colors.text, letterSpacing: -0.4 },
  muted: { color: colors.textMuted, fontSize: 13, paddingHorizontal: spacing.lg },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, gap: spacing.sm },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: radii.sm,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  rowTitle: { fontWeight: "700", color: colors.text, fontSize: 14.5 },
  rowAmount: { fontWeight: "800", color: colors.text },
});
