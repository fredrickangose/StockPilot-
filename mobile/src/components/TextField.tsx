import React, { useState } from "react";
import { StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radii, spacing } from "../theme";

export function TextField({
  label,
  icon,
  ...inputProps
}: { label: string; icon?: keyof typeof Ionicons.glyphMap } & TextInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrap, focused && styles.inputWrapFocused]}>
        {icon && (
          <Ionicons name={icon} size={18} color={focused ? colors.primary : colors.textFaint} />
        )}
        <TextInput
          style={styles.input}
          placeholderTextColor={colors.textFaint}
          autoCapitalize="none"
          onFocus={(e) => {
            setFocused(true);
            inputProps.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            inputProps.onBlur?.(e);
          }}
          {...inputProps}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  label: { fontSize: 12, fontWeight: "700", color: colors.textMuted, letterSpacing: 0.2 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
  },
  inputWrapFocused: {
    borderColor: colors.primary,
  },
  input: {
    flex: 1,
    paddingVertical: 13,
    fontSize: 16,
    color: colors.text,
  },
});
