# StockPilot app

React Native (Expo Router) app for StockPilot's owners and sellers. Runs as a native app (iOS/Android via Expo Go or a real build) and as a website — this same codebase is deployed to https://stockpilot-web-gamma.vercel.app.

## Setup

1. `npm install`
2. Copy `.env.example` to `.env` and point `EXPO_PUBLIC_API_URL` at the backend:
   - Local dev, web/iOS simulator: `http://localhost:4000`
   - Local dev, Android emulator: `http://10.0.2.2:4000`
   - Local dev, real phone via Expo Go: your computer's LAN IP, e.g. `http://192.168.1.20:4000`
   - Against the live backend: `https://stockpilot-bz6o.onrender.com`
3. `npm run web` (browser), or `npx expo start` and scan the QR code with Expo Go on your phone.

## Responsive layout

`useIsWideScreen()` (`src/hooks/useIsWideScreen.ts`, breakpoint ~768px) drives the layout split:
- **Narrow** (phone): bottom tab bar, full-screen slide-up forms — the original mobile design.
- **Wide** (desktop/laptop): a left sidebar nav (`src/components/Sidebar.tsx`) instead of tabs, and forms render as a centered dialog (`src/components/FormModal.tsx`) instead of taking over the screen.

## Barcode input

Every scan-driven screen (`owner/restock.tsx`, `seller/scan.tsx`) offers two ways to look up a product:
- **Camera scan** (`src/components/BarcodeScanner.tsx`, via `expo-camera`) — works natively on iOS/Android, and on web via the browser's `BarcodeDetector` API (native in Chrome/Edge, polyfilled elsewhere).
- **Manual entry** — a text field with Enter wired to the same lookup, so typing works, and so does a physical USB/Bluetooth barcode scanner (which "types" the code + Enter into whatever's focused).

## Deploying the website

Vercel hard-excludes any deployed path containing a `node_modules` directory segment — no way to override it via `.vercelignore`. Expo's web export puts hashed font/icon assets under `dist/assets/node_modules/...`, which 404s once deployed unless fixed. `npm run build:web` handles this: it runs `expo export -p web`, then `scripts/fix-vercel-assets.js` renames that folder to `dist/assets/vendor` and rewrites the matching references in the JS bundle.

```
EXPO_PUBLIC_API_URL=https://stockpilot-bz6o.onrender.com npm run build:web
npx vercel deploy --prod --yes
```

(`vercel.json` points Vercel at the `dist/` output directory and enables clean URLs, since the static export produces one `.html` file per route, e.g. `register.html`, and Vercel doesn't serve those at their extension-less path by default.)
