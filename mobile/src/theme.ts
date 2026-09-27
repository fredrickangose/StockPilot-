import { Platform } from "react-native";

export const colors = {
  primary: "#4338CA",
  primaryDark: "#312E81",
  primaryLight: "#EEF2FF",
  accent: "#F59E0B",
  background: "#F5F6FA",
  surface: "#FFFFFF",
  surfaceMuted: "#F1F2F7",
  border: "#E6E8F0",
  text: "#131629",
  textMuted: "#6B7080",
  textFaint: "#9EA2B3",
  danger: "#DC2626",
  dangerLight: "#FEF2F2",
  success: "#059669",
  successLight: "#ECFDF5",
  white: "#FFFFFF",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
};

/** Cross-platform elevation — shadow* for iOS/web, elevation for Android. */
export const shadow = {
  sm: Platform.select({
    android: { elevation: 2 },
    default: {
      shadowColor: "#0B0E1F",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 3,
    },
  }),
  md: Platform.select({
    android: { elevation: 6 },
    default: {
      shadowColor: "#0B0E1F",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
    },
  }),
  lg: Platform.select({
    android: { elevation: 12 },
    default: {
      shadowColor: "#0B0E1F",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.12,
      shadowRadius: 24,
    },
  }),
};

export const typography = {
  display: { fontSize: 30, fontWeight: "800" as const, letterSpacing: -0.5 },
  title: { fontSize: 22, fontWeight: "800" as const, letterSpacing: -0.3 },
  subtitle: { fontSize: 15, fontWeight: "500" as const },
  body: { fontSize: 15, fontWeight: "400" as const },
  label: { fontSize: 12, fontWeight: "700" as const, letterSpacing: 0.3 },
  caption: { fontSize: 12, fontWeight: "500" as const },
};
