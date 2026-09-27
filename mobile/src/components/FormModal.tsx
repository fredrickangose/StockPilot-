import React from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { colors, radii, shadow, spacing } from "../theme";
import { useIsWideScreen } from "../hooks/useIsWideScreen";

/**
 * Renders a form as a full-screen slide-up sheet on narrow (mobile) screens,
 * and as a centered dialog card with a dimmed backdrop on wide (desktop) screens.
 */
export function FormModal({
  visible,
  onRequestClose,
  children,
}: {
  visible: boolean;
  onRequestClose: () => void;
  children: React.ReactNode;
}) {
  const isWide = useIsWideScreen();

  if (isWide) {
    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onRequestClose}>
        <View style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onRequestClose} />
          <View style={styles.dialog}>{children}</View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onRequestClose}>
      {children}
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 41, 0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  dialog: {
    width: "100%",
    maxWidth: 480,
    maxHeight: "85%",
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    overflow: "hidden",
    ...shadow.lg,
  },
});
