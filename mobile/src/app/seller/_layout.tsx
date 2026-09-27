import { useEffect } from "react";
import { Tabs, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/auth/AuthContext";
import { colors } from "@/theme";

export default function SellerLayout() {
  const { user, isBootstrapping } = useAuth();

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
