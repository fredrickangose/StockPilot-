import { useState } from "react";
import { Link, router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Screen } from "@/components/Screen";
import { TextField } from "@/components/TextField";
import { PrimaryButton } from "@/components/PrimaryButton";
import { useAuth } from "@/auth/AuthContext";
import { ApiError } from "@/api/client";
import { colors, spacing } from "@/theme";

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
      <Text style={styles.title}>StockPilot</Text>
      <Text style={styles.subtitle}>Sign in to your business</Text>

      <View style={styles.tabRow}>
        <Pressable
          style={[styles.tab, mode === "owner" && styles.tabActive]}
          onPress={() => {
            setMode("owner");
            setError(null);
          }}
        >
          <Text style={[styles.tabText, mode === "owner" && styles.tabTextActive]}>Owner</Text>
        </Pressable>
        <Pressable
          style={[styles.tab, mode === "seller" && styles.tabActive]}
          onPress={() => {
            setMode("seller");
            setError(null);
          }}
        >
          <Text style={[styles.tabText, mode === "seller" && styles.tabTextActive]}>Seller</Text>
        </Pressable>
      </View>

      <TextField
        label="Phone number"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
        placeholder="0712345678"
      />
      <TextField
        label={mode === "owner" ? "Password" : "PIN"}
        secureTextEntry
        keyboardType={mode === "seller" ? "number-pad" : "default"}
        value={secret}
        onChangeText={setSecret}
        placeholder={mode === "owner" ? "Your password" : "4-6 digit PIN"}
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <PrimaryButton title="Sign In" onPress={handleSubmit} loading={loading} />

      {mode === "owner" && (
        <Link href="/register" style={styles.link}>
          <Text style={styles.linkText}>New business? Register here</Text>
        </Link>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 32, fontWeight: "800", color: colors.text, marginTop: spacing.xl },
  subtitle: { fontSize: 15, color: colors.textMuted, marginBottom: spacing.md },
  tabRow: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 4,
    marginBottom: spacing.sm,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 8 },
  tabActive: { backgroundColor: colors.primary },
  tabText: { fontWeight: "700", color: colors.textMuted },
  tabTextActive: { color: "#fff" },
  error: { color: colors.danger, fontSize: 14 },
  link: { alignSelf: "center", marginTop: spacing.sm },
  linkText: { color: colors.primary, fontWeight: "600" },
});
