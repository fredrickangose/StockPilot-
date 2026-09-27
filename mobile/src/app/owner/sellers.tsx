import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert, FlatList, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { listSellers, createSeller, deleteSeller } from "@/api/sellers";
import { ApiError } from "@/api/client";
import { TextField } from "@/components/TextField";
import { PrimaryButton } from "@/components/PrimaryButton";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { colors, radii, spacing, typography } from "@/theme";

export default function SellersScreen() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["sellers"], queryFn: listSellers });
  const [formOpen, setFormOpen] = useState(false);

  const sellers = data?.sellers ?? [];
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["sellers"] });

  const removeMutation = useMutation({
    mutationFn: deleteSeller,
    onSuccess: invalidate,
    onError: (err) => Alert.alert("Error", err instanceof ApiError ? err.message : "Could not remove seller."),
  });

  const confirmDelete = (id: number, name: string) => {
    Alert.alert("Remove seller", `Remove ${name}? They will no longer be able to sign in.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => removeMutation.mutate(id) },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Sellers</Text>
          <Text style={styles.count}>{sellers.length} seller{sellers.length === 1 ? "" : "s"}</Text>
        </View>
        <PrimaryButton title="Add" onPress={() => setFormOpen(true)} icon="person-add" size="sm" />
      </View>

      {isLoading ? (
        <Text style={styles.muted}>Loading…</Text>
      ) : (
        <FlatList
          data={sellers}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <EmptyState
              icon="people-outline"
              title="No sellers yet"
              subtitle="Add a seller so they can scan and record sales."
            />
          }
          renderItem={({ item }) => (
            <Card style={styles.row}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{item.name}</Text>
                <Text style={styles.muted}>{item.phone}</Text>
              </View>
              <Pressable onPress={() => confirmDelete(item.id, item.name)} hitSlop={12} style={styles.deleteBtn}>
                <Ionicons name="trash-outline" size={18} color={colors.danger} />
              </Pressable>
            </Card>
          )}
        />
      )}

      <Modal visible={formOpen} animationType="slide" onRequestClose={() => setFormOpen(false)}>
        <SellerForm
          onDone={() => {
            invalidate();
            setFormOpen(false);
          }}
          onCancel={() => setFormOpen(false)}
        />
      </Modal>
    </SafeAreaView>
  );
}

function SellerForm({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: createSeller,
    onSuccess: onDone,
    onError: (err) => setError(err instanceof ApiError ? err.message : "Could not create seller."),
  });

  const handleSave = () => {
    setError(null);
    if (!name.trim() || !phone.trim() || !/^\d{4,6}$/.test(pin)) {
      setError("Enter a name, phone number, and a 4-6 digit PIN.");
      return;
    }
    createMutation.mutate({ name: name.trim(), phone: phone.trim(), pin });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.formHeader}>
        <Pressable onPress={onCancel} hitSlop={12}>
          <Ionicons name="close" size={24} color={colors.textMuted} />
        </Pressable>
        <Text style={styles.formTitle}>Add Seller</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.formContent}>
        <TextField label="Name" icon="person" value={name} onChangeText={setName} placeholder="e.g. John Mwangi" />
        <TextField label="Phone number" icon="call" keyboardType="phone-pad" value={phone} onChangeText={setPhone} placeholder="0712345678" />
        <TextField label="PIN (4-6 digits)" icon="keypad" keyboardType="number-pad" secureTextEntry value={pin} onChangeText={setPin} placeholder="1234" />

        {error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={16} color={colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.hintBox}>
          <Ionicons name="information-circle" size={16} color={colors.primary} />
          <Text style={styles.hint}>
            Share this phone number and PIN with the seller directly — they'll use them to sign in.
          </Text>
        </View>

        <PrimaryButton title="Add Seller" onPress={handleSave} loading={createMutation.isPending} icon="checkmark" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.lg,
  },
  headerTitle: { ...typography.title, color: colors.text },
  count: { color: colors.textMuted, fontWeight: "600", fontSize: 13 },
  muted: { color: colors.textMuted, fontSize: 13, padding: spacing.lg },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, gap: spacing.sm },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: colors.primary, fontWeight: "800", fontSize: 15 },
  rowTitle: { fontWeight: "700", color: colors.text, fontSize: 15 },
  deleteBtn: { padding: 4 },
  formHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  formTitle: { fontSize: 17, fontWeight: "800", color: colors.text },
  formContent: { padding: spacing.lg, gap: spacing.md },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.dangerLight,
    padding: spacing.sm,
    borderRadius: 8,
  },
  errorText: { color: colors.danger, fontSize: 13, fontWeight: "600", flex: 1 },
  hintBox: {
    flexDirection: "row",
    gap: 6,
    backgroundColor: colors.primaryLight,
    padding: spacing.sm,
    borderRadius: 8,
    alignItems: "flex-start",
  },
  hint: { color: colors.primaryDark, fontSize: 12.5, flex: 1, lineHeight: 17 },
});
