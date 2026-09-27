import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const ACCESS_TOKEN_KEY = "stockpilot_access_token";
const REFRESH_TOKEN_KEY = "stockpilot_refresh_token";

// expo-secure-store has no web implementation (no Keychain/Keystore equivalent).
// Native builds get real secure storage; web falls back to localStorage, which is
// fine for local development/preview since StockPilot's actual target is native.
const storage = {
  async get(key: string): Promise<string | null> {
    if (Platform.OS === "web") {
      return typeof localStorage !== "undefined" ? localStorage.getItem(key) : null;
    }
    return SecureStore.getItemAsync(key);
  },
  async set(key: string, value: string): Promise<void> {
    if (Platform.OS === "web") {
      if (typeof localStorage !== "undefined") localStorage.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },
  async remove(key: string): Promise<void> {
    if (Platform.OS === "web") {
      if (typeof localStorage !== "undefined") localStorage.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};

let accessToken: string | null = null;
let refreshToken: string | null = null;

export async function loadTokens(): Promise<{
  accessToken: string | null;
  refreshToken: string | null;
}> {
  accessToken = await storage.get(ACCESS_TOKEN_KEY);
  refreshToken = await storage.get(REFRESH_TOKEN_KEY);
  return { accessToken, refreshToken };
}

export async function saveTokens(next: {
  accessToken: string;
  refreshToken: string;
}): Promise<void> {
  accessToken = next.accessToken;
  refreshToken = next.refreshToken;
  await storage.set(ACCESS_TOKEN_KEY, next.accessToken);
  await storage.set(REFRESH_TOKEN_KEY, next.refreshToken);
}

export async function clearTokens(): Promise<void> {
  accessToken = null;
  refreshToken = null;
  await storage.remove(ACCESS_TOKEN_KEY);
  await storage.remove(REFRESH_TOKEN_KEY);
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function getRefreshToken(): string | null {
  return refreshToken;
}
