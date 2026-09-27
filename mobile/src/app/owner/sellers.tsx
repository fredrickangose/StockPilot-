import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert, FlatList, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { listSellers, createSeller, deleteSeller } from "@/api/sellers";
import { ApiError } from "@/api/client";
import { TextField } from "@/components/TextField";
import { PrimaryButton } from "@/components/PrimaryButton";
import { colors, spacing } from "@/theme";

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
    <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
      <View style={styles.header}>
        <Text style={styles.count}>{sellers.length} seller{sellers.length === 1 ? "" : "s"}</Text>
        <PrimaryButton title="+ Add Seller" onPress={() => setFormOpen(true)} />
      </View>

      {isLoading ? (
        <Text style={styles.muted}>Loading…</Text>
      ) : (
        <FlatList
          data={sellers}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={styles.muted}>No sellers yet. Add one to let them record sales.</Text>}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View>
                <Text style={styles.rowTitle}>{item.name}</Text>
                <Text style={styles.muted}>{item.phone}</Text>
              </View>
              <Pressable onPress={() => confirmDelete(item.id, item.name)} hitSlop={12}>
                <Ionicons name="trash-outline" size={20} color={colors.danger} />
              </Pressable>
            </View>
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
      <View style={styles.formContent}>
        <Text style={styles.formTitle}>Add Seller</Text>
        <TextField label="Name" value={name} onChangeText={setName} placeholder="e.g. John Mwangi" />
        <TextField label="Phone number" keyboardType="phone-pad" value={phone} onChangeText={setPhone} placeholder="0712345678" />
        <TextField label="PIN (4-6 digits)" keyboardType="number-pad" secureTextEntry value={pin} onChangeText={setPin} placeholder="1234" />

        {error && <Text style={styles.error}>{error}</Text>}

        <Text style={styles.hint}>
          Share this phone number and PIN with the seller directly — they'll use them to sign in.
        </Text>

        <PrimaryButton title="Add Seller" onPress={handleSave} loading={createMutation.isPending} />
        <PrimaryButton title="Cancel" onPress={onCancel} variant="outline" />
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
  count: { color: colors.textMuted, fontWeight: "600" },
  muted: { color: colors.textMuted, padding: spacing.lg },
  error: { color: colors.danger },
  hint: { color: colors.textMuted, fontSize: 13 },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, gap: spacing.sm },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  rowTitle: { fontWeight: "700", color: colors.text, fontSize: 15 },
  formContent: { padding: spacing.lg, gap: spacing.md },
  formTitle: { fontSize: 20, fontWeight: "800", color: colors.text },
});
