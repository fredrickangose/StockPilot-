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

**Continuous deployment is live**: pushing to `main` auto-deploys to https://stockpilot-web-gamma.vercel.app via Vercel's GitHub integration on the `kariobangi-legends/stockpilot-web` project. No manual step needed for a normal change.

Two project-level settings make that work correctly (already configured in the Vercel dashboard, not something `vercel.json` alone can express for a monorepo):
- **Root Directory** = `mobile` — this repo has `server/` and `mobile/` as siblings, so Vercel needs to be told which subfolder is the actual site.
- **Environment Variable** `EXPO_PUBLIC_API_URL` = `https://stockpilot-bz6o.onrender.com` (Production) — without this, the build falls back to whatever's in `.env` locally (`localhost:4000`), which would ship a site that can't reach the backend.

`vercel.json`'s `buildCommand` (`npm run build:web`) handles a real Vercel-only gotcha: Vercel hard-excludes any deployed path containing a `node_modules` directory segment, with no way to override it via `.vercelignore` — confirmed by testing directly against Vercel's API. Expo's web export puts hashed font/icon assets under `dist/assets/node_modules/...`, which silently 404s once deployed unless fixed. `scripts/fix-vercel-assets.js` renames that folder to `dist/assets/vendor` and rewrites the matching references in the JS bundle; it's chained into `build:web`.

**Manual CLI deploys don't work for this project** — `npx vercel deploy` (from `mobile/` or with `--cwd mobile` from the repo root) fails with "Root Directory 'mobile' does not exist." That's a real Vercel CLI/monorepo limitation: the project's Root Directory setting (needed for Git-triggered deploys, which clone the whole repo) conflicts with a CLI deploy that's already scoped to just the `mobile/` folder's contents — there's no combination of flags that satisfies both. Just push to `main`; that's the only supported deploy path now. To test a change before it's live, run `npm run web` locally and verify there, then push.
