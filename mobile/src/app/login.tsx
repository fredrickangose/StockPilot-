import { useState } from "react";
import { Link, router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Screen } from "@/components/Screen";
import { TextField } from "@/components/TextField";
import { PrimaryButton } from "@/components/PrimaryButton";
import { useAuth } from "@/auth/AuthContext";
import { ApiError } from "@/api/client";
import { colors, radii, spacing, typography } from "@/theme";

type Mode = "owner" | "seller";

export default function LoginScreen() {
  const { loginOwner, loginSeller } = useAuth();
  const [mode, setMode] = useState<Mode>("owner");
  const [phone, setPhone] = useState("");
  const [secret, setSecret] = useState(""); // password (owner) or PIN (seller)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    if (!phone.trim() || !secret.trim()) {
      setError("Enter your phone number and " + (mode === "owner" ? "password" : "PIN"));
      return;
    }
    setLoading(true);
    try {
      if (mode === "owner") {
        await loginOwner(phone.trim(), secret);
        router.replace("/owner/dashboard");
      } else {
        await loginSeller(phone.trim(), secret);
        router.replace("/seller/scan");
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <View style={styles.hero}>
        <View style={styles.logoMark}>
          <Ionicons name="cube" size={26} color={colors.white} />
        </View>
        <Text style={styles.brand}>StockPilot</Text>
        <Text style={styles.subtitle}>Sign in to your business</Text>
      </View>

      <View style={styles.tabRow}>
        <Pressable
          style={[styles.tab, mode === "owner" && styles.tabActive]}
          onPress={() => {
            setMode("owner");
            setError(null);
          }}
        >
          <Ionicons
            name="storefront"
            size={16}
            color={mode === "owner" ? colors.white : colors.textMuted}
          />
          <Text style={[styles.tabText, mode === "owner" && styles.tabTextActive]}>Owner</Text>
        </Pressable>
        <Pressable
          style={[styles.tab, mode === "seller" && styles.tabActive]}
          onPress={() => {
            setMode("seller");
            setError(null);
          }}
        >
          <Ionicons
            name="person"
            size={16}
            color={mode === "seller" ? colors.white : colors.textMuted}
          />
          <Text style={[styles.tabText, mode === "seller" && styles.tabTextActive]}>Seller</Text>
        </Pressable>
      </View>

      <View style={styles.form}>
        <TextField
          label="Phone number"
          icon="call"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
          placeholder="0712345678"
        />
        <TextField
          label={mode === "owner" ? "Password" : "PIN"}
          icon="lock-closed"
          secureTextEntry
          keyboardType={mode === "seller" ? "number-pad" : "default"}
          value={secret}
          onChangeText={setSecret}
          placeholder={mode === "owner" ? "Your password" : "4-6 digit PIN"}
        />

        {error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={16} color={colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <PrimaryButton title="Sign In" onPress={handleSubmit} loading={loading} icon="log-in" />
      </View>

      {mode === "owner" && (
        <Link href="/register" style={styles.link}>
          <Text style={styles.linkText}>New business? Register here</Text>
        </Link>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: "center", marginTop: spacing.xl, marginBottom: spacing.md, gap: 4 },
  logoMark: {
    width: 60,
    height: 60,
    borderRadius: radii.xl,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  brand: { ...typography.display, color: colors.text },
  subtitle: { ...typography.subtitle, color: colors.textMuted },
  tabRow: {
    flexDirection: "row",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    padding: 4,
    marginBottom: spacing.md,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 11,
    borderRadius: radii.sm,
  },
  tabActive: { backgroundColor: colors.primary },
  tabText: { fontWeight: "700", color: colors.textMuted, fontSize: 14 },
  tabTextActive: { color: colors.white },
  form: { gap: spacing.md },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.dangerLight,
    padding: spacing.sm,
    borderRadius: radii.sm,
  },
  errorText: { color: colors.danger, fontSize: 13, fontWeight: "600", flex: 1 },
  link: { alignSelf: "center", marginTop: spacing.md },
  linkText: { color: colors.primary, fontWeight: "700", fontSize: 14 },
});
