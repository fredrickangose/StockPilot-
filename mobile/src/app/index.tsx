import { useEffect } from "react";
import { router } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "@/auth/AuthContext";
import { colors } from "@/theme";

export default function Index() {
  const { user, isBootstrapping } = useAuth();

  useEffect(() => {
    if (isBootstrapping) return;
    if (!user) {
      router.replace("/login");
    } else if (user.role === "owner") {
      router.replace("/owner/dashboard");
    } else {
      router.replace("/seller/scan");
    }
  }, [user, isBootstrapping]);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}
