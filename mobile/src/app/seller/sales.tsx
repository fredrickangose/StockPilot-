import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { listMySales } from "@/api/sales";
import { colors, spacing } from "@/theme";

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
    <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
      <View style={styles.header}>
        <Text style={styles.totalLabel}>Your total sales</Text>
        <Text style={styles.totalValue}>Ksh {total.toLocaleString()}</Text>
      </View>

      {isLoading ? (
        <Text style={styles.muted}>Loading…</Text>
      ) : (
        <FlatList
          data={sales}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          ListEmptyComponent={<Text style={styles.muted}>No sales recorded yet.</Text>}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View>
                <Text style={styles.rowTitle}>{item.quantity} unit{item.quantity === 1 ? "" : "s"}</Text>
                <Text style={styles.muted}>{new Date(item.createdAt).toLocaleString()}</Text>
              </View>
              <Text style={styles.rowAmount}>Ksh {item.totalAmount}</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: { padding: spacing.lg, gap: 4 },
  totalLabel: { color: colors.textMuted, fontWeight: "600" },
  totalValue: { fontSize: 32, fontWeight: "800", color: colors.text },
  muted: { color: colors.textMuted, paddingHorizontal: spacing.lg },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, gap: spacing.sm },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  rowTitle: { fontWeight: "700", color: colors.text },
  rowAmount: { fontWeight: "800", color: colors.primary },
});
