import React from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing } from "../theme";
import { useIsWideScreen } from "../hooks/useIsWideScreen";

const MAX_CONTENT_WIDTH = 480;

export function Screen({
  children,
  scroll = true,
}: {
  children: React.ReactNode;
  scroll?: boolean;
}) {
  const isWide = useIsWideScreen();
  const Body = scroll ? ScrollView : View;
  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Body
          style={styles.flex}
          contentContainerStyle={[
            scroll && styles.scrollContent,
            isWide && styles.wideOuter,
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={isWide ? styles.wideInner : styles.flexGrow}>{children}</View>
        </Body>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  flexGrow: { gap: spacing.md },
  scrollContent: { padding: spacing.lg, flexGrow: 1 },
  wideOuter: { alignItems: "center" },
  wideInner: { width: "100%", maxWidth: MAX_CONTENT_WIDTH, gap: spacing.md },
});
