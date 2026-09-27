/**
 * Points at the StockPilot API. Override via EXPO_PUBLIC_API_URL in .env.
 * - Web (`expo start --web`) and iOS simulator: http://localhost:4000 works as-is.
 * - Android emulator: use http://10.0.2.2:4000 instead (maps to host machine).
 * - A real phone: use your computer's LAN IP, e.g. http://192.168.1.20:4000.
 */
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4000";
