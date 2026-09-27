import { useEffect } from "react";
import { Tabs, Slot, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { useAuth } from "@/auth/AuthContext";
import { colors, radii, spacing } from "@/theme";
import { useIsWideScreen } from "@/hooks/useIsWideScreen";
import { Sidebar, type SidebarItem } from "@/components/Sidebar";
import { PrimaryButton } from "@/components/PrimaryButton";

const SELLER_NAV: SidebarItem[] = [
  { href: "/seller/scan", label: "Sell", icon: "scan" },
  { href: "/seller/sales", label: "My Sales", icon: "receipt" },
];

export default function SellerLayout() {
  const { user, businessName, isBootstrapping, logout } = useAuth();
  const isWide = useIsWideScreen();

  useEffect(() => {
    if (isBootstrapping) return;
    if (!user) {
      router.replace("/login");
    } else if (user.role !== "seller") {
      router.replace("/owner/dashboard");
    }
  }, [user, isBootstrapping]);

  if (isBootstrapping || !user || user.role !== "seller") {
    return null;
  }

  if (isWide) {
    return (
      <View style={styles.wideContainer}>
        <Sidebar
          items={SELLER_NAV}
          header={
            <View style={styles.brand}>
              <View style={styles.logoMark}>
                <Ionicons name="cube" size={18} color={colors.white} />
              </View>
              <View style={styles.brandText}>
                <Text style={styles.brandName}>StockPilot</Text>
                <Text style={styles.brandBusiness} numberOfLines={1}>
                  {businessName}
                </Text>
              </View>
            </View>
          }
          footer={
            <PrimaryButton title="Sign Out" onPress={logout} variant="ghost" icon="log-out-outline" size="sm" />
          }
        />
        <View style={styles.content}>
          <Slot />
        </View>
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarStyle: {
          borderTopColor: colors.border,
          height: 60,
          paddingTop: 8,
          paddingBottom: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "700" },
      }}
    >
      <Tabs.Screen
        name="scan"
        options={{
          title: "Sell",
          tabBarIcon: ({ color, size }) => <Ionicons name="scan" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="sales"
        options={{
          title: "My Sales",
          tabBarIcon: ({ color, size }) => <Ionicons name="receipt" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  wideContainer: { flex: 1, flexDirection: "row", backgroundColor: colors.background },
  content: { flex: 1 },
  brand: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: spacing.sm, paddingHorizontal: 4 },
  logoMark: {
    width: 34,
    height: 34,
    borderRadius: radii.sm,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  brandText: { flex: 1 },
  brandName: { fontWeight: "800", fontSize: 15, color: colors.text },
  brandBusiness: { fontSize: 11, color: colors.textMuted },
});
