import { useQuery } from "@tanstack/react-query";
import { RefreshControl, StyleSheet, Text, View } from "react-native";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getReportSummary } from "@/api/reports";
import { useAuth } from "@/auth/AuthContext";
import { PrimaryButton } from "@/components/PrimaryButton";
import { colors, spacing } from "@/theme";

function money(n: number) {
  return `Ksh ${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export default function DashboardScreen() {
  const { businessName, logout } = useAuth();
  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ["reports", "summary"],
    queryFn: getReportSummary,
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      >
        <Text style={styles.businessName}>{businessName ?? "Your Business"}</Text>

        {isLoading && <Text style={styles.muted}>Loading…</Text>}
        {isError && <Text style={styles.error}>Couldn't load your reports. Pull down to retry.</Text>}

        {data && (
          <>
            <View style={styles.grid}>
              <StatCard label="Total Investment" value={money(data.totalInvestment)} />
              <StatCard label="Total Sales" value={money(data.totalSales)} />
              <StatCard label="Profit" value={money(data.profit)} highlight={data.profit >= 0} />
              <StatCard label="Stock Value" value={money(data.currentStockValue)} />
            </View>

            <Text style={styles.sectionTitle}>Sales by Seller</Text>
            {data.perSeller.length === 0 ? (
              <Text style={styles.muted}>No sales recorded yet.</Text>
            ) : (
              data.perSeller.map((row) => (
                <View key={row.sellerId} style={styles.sellerRow}>
                  <View>
                    <Text style={styles.sellerName}>{row.sellerName}</Text>
                    <Text style={styles.muted}>{row.saleCount} sale{row.saleCount === 1 ? "" : "s"}</Text>
                  </View>
                  <Text style={styles.sellerTotal}>{money(row.totalSales)}</Text>
                </View>
              ))
            )}
          </>
        )}

        <PrimaryButton title="Sign Out" onPress={logout} variant="outline" />
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>{label}</Text>
      <Text style={[styles.cardValue, highlight === false && styles.cardValueNegative]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md },
  businessName: { fontSize: 22, fontWeight: "800", color: colors.text },
  muted: { color: colors.textMuted },
  error: { color: colors.danger },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  card: {
    flexBasis: "47%",
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 4,
  },
  cardLabel: { fontSize: 12, fontWeight: "600", color: colors.textMuted },
  cardValue: { fontSize: 20, fontWeight: "800", color: colors.text },
  cardValueNegative: { color: colors.danger },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: colors.text, marginTop: spacing.sm },
  sellerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  sellerName: { fontWeight: "700", color: colors.text },
  sellerTotal: { fontWeight: "800", color: colors.primary },
});
