import React, { useRef } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radii, shadow } from "../theme";

export function PrimaryButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = "primary",
  icon,
  size = "md",
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "outline" | "danger" | "ghost";
  icon?: keyof typeof Ionicons.glyphMap;
  size?: "md" | "sm";
}) {
  const isDisabled = disabled || loading;
  // react-native-web's Pressable can occasionally deliver two press events for one
  // tap (pointer + synthetic click). The `loading`/`disabled` prop only blocks
  // presses once React re-renders, which isn't always fast enough to catch a
  // same-tick double-fire — this guard blocks re-entrant calls immediately.
  const firingRef = useRef(false);

  const handlePress = () => {
    if (firingRef.current || isDisabled) return;
    firingRef.current = true;
    onPress();
    setTimeout(() => {
      firingRef.current = false;
    }, 400);
  };

  const iconColor =
    variant === "outline" || variant === "ghost" ? colors.primary : colors.white;

  return (
    <Pressable
      onPress={handlePress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        size === "sm" && styles.sizeSm,
        variant === "primary" && styles.primary,
        variant === "outline" && styles.outline,
        variant === "danger" && styles.danger,
        variant === "ghost" && styles.ghost,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={iconColor} />
      ) : (
        <View style={styles.content}>
          {icon && <Ionicons name={icon} size={size === "sm" ? 16 : 18} color={iconColor} />}
          <Text
            style={[
              styles.text,
              size === "sm" && styles.textSm,
              (variant === "outline" || variant === "ghost") && styles.outlineText,
            ]}
          >
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.md,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  sizeSm: { paddingVertical: 10, borderRadius: radii.sm },
  content: { flexDirection: "row", alignItems: "center", gap: 8 },
  primary: { backgroundColor: colors.primary, ...shadow.sm },
  outline: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.primary },
  danger: { backgroundColor: colors.danger, ...shadow.sm },
  ghost: { backgroundColor: "transparent" },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  text: { color: colors.white, fontSize: 15, fontWeight: "700" },
  textSm: { fontSize: 13 },
  outlineText: { color: colors.primary },
});
