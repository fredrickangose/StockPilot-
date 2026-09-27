import { useState } from "react";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Screen } from "@/components/Screen";
import { TextField } from "@/components/TextField";
import { PrimaryButton } from "@/components/PrimaryButton";
import { useAuth } from "@/auth/AuthContext";
import { ApiError } from "@/api/client";
import { colors, spacing, typography } from "@/theme";

export default function RegisterScreen() {
  const { registerOwner } = useAuth();
  const [businessName, setBusinessName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    if (!businessName.trim() || !ownerName.trim() || !phone.trim() || password.length < 6) {
      setError("Fill in all fields. Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      await registerOwner({
        businessName: businessName.trim(),
        ownerName: ownerName.trim(),
        phone: phone.trim(),
        password,
      });
      router.replace("/owner/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <Pressable style={styles.backRow} onPress={() => router.back()} hitSlop={12}>
        <Ionicons name="chevron-back" size={20} color={colors.textMuted} />
        <Text style={styles.backText}>Back</Text>
      </Pressable>

      <View style={styles.hero}>
        <Text style={styles.title}>Create your business</Text>
        <Text style={styles.subtitle}>Set up StockPilot for your shop in a minute</Text>
      </View>

      <View style={styles.form}>
        <TextField
          label="Business name"
          icon="storefront"
          value={businessName}
          onChangeText={setBusinessName}
          placeholder="e.g. Mama Njeri's Shop"
        />
        <TextField
          label="Your name"
          icon="person"
          value={ownerName}
          onChangeText={setOwnerName}
          placeholder="e.g. Jane Njeri"
        />
        <TextField
          label="Phone number"
          icon="call"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
          placeholder="0712345678"
        />
        <TextField
          label="Password"
          icon="lock-closed"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          placeholder="At least 6 characters"
        />

        {error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={16} color={colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <PrimaryButton title="Create Business" onPress={handleSubmit} loading={loading} icon="rocket" />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  backRow: { flexDirection: "row", alignItems: "center", marginTop: spacing.sm },
  backText: { color: colors.textMuted, fontWeight: "600", fontSize: 14 },
  hero: { marginTop: spacing.md, marginBottom: spacing.sm, gap: 4 },
  title: { ...typography.title, color: colors.text },
  subtitle: { ...typography.subtitle, color: colors.textMuted },
  form: { gap: spacing.md },
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
