import { useQuery } from "@tanstack/react-query";
import { RefreshControl, StyleSheet, Text, View } from "react-native";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { getReportSummary } from "@/api/reports";
import { useAuth } from "@/auth/AuthContext";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { PrimaryButton } from "@/components/PrimaryButton";
import { colors, radii, spacing, typography } from "@/theme";

function money(n: number) {
  return `Ksh ${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export default function DashboardScreen() {
  const { user, businessName, logout } = useAuth();
  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ["reports", "summary"],
    queryFn: getReportSummary,
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
      >
        <View>
          <Text style={styles.greeting}>Welcome back, {user?.name?.split(" ")[0]}</Text>
          <Text style={styles.businessName}>{businessName ?? "Your Business"}</Text>
        </View>

        {isLoading && <Text style={styles.muted}>Loading…</Text>}
        {isError && (
          <Card style={styles.errorCard}>
            <Ionicons name="cloud-offline" size={20} color={colors.danger} />
            <Text style={styles.error}>Couldn't load your reports. Pull down to retry.</Text>
          </Card>
        )}

        {data && (
          <>
            <View style={styles.grid}>
              <StatCard icon="wallet" label="Investment" value={money(data.totalInvestment)} tone="primary" />
              <StatCard icon="cart" label="Total Sales" value={money(data.totalSales)} tone="accent" />
              <StatCard
                icon="trending-up"
                label="Profit"
                value={money(data.profit)}
                tone={data.profit >= 0 ? "success" : "danger"}
              />
              <StatCard icon="cube" label="Stock Value" value={money(data.currentStockValue)} tone="neutral" />
            </View>

            <Text style={styles.sectionTitle}>Sales by Seller</Text>
            {data.perSeller.length === 0 ? (
              <Card>
                <EmptyState
                  icon="people-outline"
                  title="No sales yet"
                  subtitle="Once your sellers record sales, their totals show up here."
                />
              </Card>
            ) : (
              <Card padded={false} style={styles.sellerCard}>
                {data.perSeller.map((row, index) => (
                  <View
                    key={row.sellerId}
                    style={[styles.sellerRow, index > 0 && styles.sellerRowBorder]}
                  >
                    <View style={styles.sellerAvatar}>
                      <Text style={styles.sellerInitial}>{row.sellerName.charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.sellerName}>{row.sellerName}</Text>
                      <Text style={styles.muted}>
                        {row.saleCount} sale{row.saleCount === 1 ? "" : "s"}
                      </Text>
                    </View>
                    <Text style={styles.sellerTotal}>{money(row.totalSales)}</Text>
                  </View>
                ))}
              </Card>
            )}
          </>
        )}

        <PrimaryButton title="Sign Out" onPress={logout} variant="ghost" icon="log-out-outline" />
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  tone: "primary" | "accent" | "success" | "danger" | "neutral";
}) {
  const toneColors: Record<string, { bg: string; fg: string }> = {
    primary: { bg: colors.primaryLight, fg: colors.primary },
    accent: { bg: "#FEF3C7", fg: "#B45309" },
    success: { bg: colors.successLight, fg: colors.success },
    danger: { bg: colors.dangerLight, fg: colors.danger },
    neutral: { bg: colors.surfaceMuted, fg: colors.text },
  };
  const t = toneColors[tone];
  return (
    <Card style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: t.bg }]}>
        <Ionicons name={icon} size={18} color={t.fg} />
      </View>
      <Text style={styles.cardLabel}>{label}</Text>
      <Text style={styles.cardValue}>{value}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  greeting: { ...typography.caption, color: colors.textMuted },
  businessName: { ...typography.display, color: colors.text },
  muted: { color: colors.textMuted, fontSize: 13 },
  error: { color: colors.danger, flex: 1, fontWeight: "600" },
  errorCard: { flexDirection: "row", alignItems: "center", gap: 8 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  statCard: { flexBasis: "47%", flexGrow: 1, gap: 6 },
  statIcon: {
    width: 34,
    height: 34,
    borderRadius: radii.sm,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  cardLabel: { ...typography.caption, color: colors.textMuted },
  cardValue: { fontSize: 19, fontWeight: "800", color: colors.text, letterSpacing: -0.3 },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: colors.text, marginTop: spacing.xs },
  sellerCard: { overflow: "hidden" },
  sellerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
  },
  sellerRowBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  sellerAvatar: {
    width: 38,
    height: 38,
    borderRadius: radii.pill,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  sellerInitial: { color: colors.primary, fontWeight: "800", fontSize: 15 },
  sellerName: { fontWeight: "700", color: colors.text, fontSize: 14.5 },
  sellerTotal: { fontWeight: "800", color: colors.text },
});
