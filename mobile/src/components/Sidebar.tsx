import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";
import { colors, radii, spacing } from "../theme";

export interface SidebarItem {
  href: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

export function Sidebar({
  items,
  header,
  footer,
}: {
  items: SidebarItem[];
  header?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <View style={styles.sidebar}>
      {header}
      <View style={styles.nav}>
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Pressable
              key={item.href}
              onPress={() => router.replace(item.href as never)}
              style={[styles.navItem, active && styles.navItemActive]}
            >
              <Ionicons name={item.icon} size={19} color={active ? colors.white : colors.textMuted} />
              <Text style={[styles.navLabel, active && styles.navLabelActive]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.spacer} />
      {footer}
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: 240,
    backgroundColor: colors.surface,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    padding: spacing.md,
    gap: spacing.lg,
  },
  nav: { gap: 4 },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radii.sm,
  },
  navItemActive: { backgroundColor: colors.primary },
  navLabel: { fontWeight: "700", color: colors.textMuted, fontSize: 14 },
  navLabelActive: { color: colors.white },
  spacer: { flex: 1 },
});
