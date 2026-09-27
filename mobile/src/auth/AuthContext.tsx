import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import * as authApi from "../api/auth";
import type { AuthUser } from "../api/types";
import { loadTokens, saveTokens, clearTokens, getRefreshToken } from "./tokenStore";
import { setOnAuthExpired } from "../api/client";

interface AuthContextValue {
  user: AuthUser | null;
  businessName: string | null;
  isBootstrapping: boolean;
  loginOwner: (phone: string, password: string) => Promise<void>;
  loginSeller: (phone: string, pin: string) => Promise<void>;
  registerOwner: (data: {
    businessName: string;
    ownerName: string;
    phone: string;
    password: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [businessName, setBusinessName] = useState<string | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const handleAuthExpired = useCallback(() => {
    setUser(null);
    setBusinessName(null);
  }, []);

  useEffect(() => {
    setOnAuthExpired(handleAuthExpired);
  }, [handleAuthExpired]);

  useEffect(() => {
    (async () => {
      const { accessToken } = await loadTokens();
      if (!accessToken) {
        setIsBootstrapping(false);
        return;
      }
      try {
        const me = await authApi.getMe();
        setUser(me.user);
        setBusinessName(me.business?.name ?? null);
      } catch {
        await clearTokens();
      } finally {
        setIsBootstrapping(false);
      }
    })();
  }, []);

  const loginOwner = useCallback(async (phone: string, password: string) => {
    const res = await authApi.loginOwner({ phone, password });
    await saveTokens({ accessToken: res.accessToken, refreshToken: res.refreshToken });
    setUser(res.user);
    setBusinessName(res.business?.name ?? null);
  }, []);

  const loginSeller = useCallback(async (phone: string, pin: string) => {
    const res = await authApi.loginSeller({ phone, pin });
    await saveTokens({ accessToken: res.accessToken, refreshToken: res.refreshToken });
    setUser(res.user);
    setBusinessName(res.business?.name ?? null);
  }, []);

  const registerOwner = useCallback(
    async (data: { businessName: string; ownerName: string; phone: string; password: string }) => {
      const res = await authApi.registerOwner(data);
      await saveTokens({ accessToken: res.accessToken, refreshToken: res.refreshToken });
      setUser(res.user);
      setBusinessName(res.business?.name ?? null);
    },
    []
  );

  const logout = useCallback(async () => {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      try {
        await authApi.logout(refreshToken);
      } catch {
        // best-effort revoke; clear local state regardless
      }
    }
    await clearTokens();
    setUser(null);
    setBusinessName(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, businessName, isBootstrapping, loginOwner, loginSeller, registerOwner, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
