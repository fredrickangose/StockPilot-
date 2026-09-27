import { apiFetch } from "./client";
import type { AuthResponse, AuthUser } from "./types";

export function registerOwner(data: {
  businessName: string;
  ownerName: string;
  phone: string;
  password: string;
}) {
  return apiFetch<AuthResponse>("/auth/register-owner", { method: "POST", body: data, skipAuth: true });
}

export function loginOwner(data: { phone: string; password: string }) {
  return apiFetch<AuthResponse>("/auth/login-owner", { method: "POST", body: data, skipAuth: true });
}

export function loginSeller(data: { phone: string; pin: string }) {
  return apiFetch<AuthResponse>("/auth/login-seller", { method: "POST", body: data, skipAuth: true });
}

export function logout(refreshToken: string) {
  return apiFetch<void>("/auth/logout", { method: "POST", body: { refreshToken }, skipAuth: true });
}

export function getMe() {
  return apiFetch<{ user: AuthUser; business?: { id: number; name: string } }>("/auth/me");
}
