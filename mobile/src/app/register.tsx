import { useState } from "react";
import { router } from "expo-router";
import { StyleSheet, Text } from "react-native";
import { Screen } from "@/components/Screen";
import { TextField } from "@/components/TextField";
import { PrimaryButton } from "@/components/PrimaryButton";
import { useAuth } from "@/auth/AuthContext";
import { ApiError } from "@/api/client";
import { colors, spacing } from "@/theme";

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
      <Text style={styles.title}>Create your business</Text>
      <Text style={styles.subtitle}>Set up StockPilot for your shop</Text>

      <TextField label="Business name" value={businessName} onChangeText={setBusinessName} placeholder="e.g. Mama Njeri's Shop" />
      <TextField label="Your name" value={ownerName} onChangeText={setOwnerName} placeholder="e.g. Jane Njeri" />
      <TextField label="Phone number" keyboardType="phone-pad" value={phone} onChangeText={setPhone} placeholder="0712345678" />
      <TextField label="Password" secureTextEntry value={password} onChangeText={setPassword} placeholder="At least 6 characters" />

      {error && <Text style={styles.error}>{error}</Text>}

      <PrimaryButton title="Create Business" onPress={handleSubmit} loading={loading} />
      <PrimaryButton title="Back to Sign In" onPress={() => router.back()} variant="outline" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 26, fontWeight: "800", color: colors.text, marginTop: spacing.lg },
  subtitle: { fontSize: 15, color: colors.textMuted, marginBottom: spacing.sm },
  error: { color: colors.danger, fontSize: 14 },
});
