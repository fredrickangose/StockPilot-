import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, radii } from "../theme";

type Tone = "neutral" | "success" | "danger" | "primary" | "accent";

const TONE_STYLES: Record<Tone, { bg: string; fg: string }> = {
  neutral: { bg: colors.surfaceMuted, fg: colors.textMuted },
  success: { bg: colors.successLight, fg: colors.success },
  danger: { bg: colors.dangerLight, fg: colors.danger },
  primary: { bg: colors.primaryLight, fg: colors.primary },
  accent: { bg: "#FEF3C7", fg: "#92400E" },
};

export function Badge({ label, tone = "neutral" }: { label: string; tone?: Tone }) {
  const t = TONE_STYLES[tone];
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }]}>
      <Text style={[styles.text, { color: t.fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
    alignSelf: "flex-start",
  },
  text: { fontSize: 11, fontWeight: "700", letterSpacing: 0.2 },
});
