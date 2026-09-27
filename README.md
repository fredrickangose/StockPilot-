# StockPilot

Multi-tenant inventory & point-of-sale system for small businesses. An owner adds products and assigns each a barcode; restocking is "scan the barcode, enter quantity and cost." Sellers each have their own account, scan a barcode to record a sale, and the owner sees stock levels, per-seller sales, profit, and total investment from one dashboard.

## Live

- **Website**: https://stockpilot-web-gamma.vercel.app
- **API**: https://stockpilot-bz6o.onrender.com

The API runs on Render's free tier, which sleeps after ~15 minutes of inactivity — the first request after a gap can take up to ~25-30 seconds while it wakes back up. Upgrade to a paid Render plan later to remove that delay.

## Structure

- `server/` — Node/TypeScript backend (Express + Drizzle ORM + Postgres). See `server/README.md`.
- `mobile/` — React Native (Expo) app for owners and sellers; also builds/deploys as the website above via Expo's web export. See `mobile/README.md`.

## Status

The backend and the app (mobile + website) are built and verified end-to-end against the live deployed stack: register a business, add a product with a barcode, restock it (camera scan or manual/USB-scanner entry), add a seller, sign in as that seller, scan and record a sale, and view the owner's reports dashboard (investment, sales, profit, stock value, per-seller totals) all work correctly.

The UI is responsive: a bottom tab bar on phone-width screens, a sidebar + centered dialogs on desktop-width screens (~768px+).

Camera-based barcode *decoding* is wired up via `expo-camera`'s web `BarcodeDetector` integration but hasn't been pixel-tested against a real printed barcode in this environment (no camera hardware here) — the permission flow and live preview are confirmed working. Manual barcode entry (typing, or a physical USB/Bluetooth scanner typing into the field) is fully verified and always available as a fallback on every scan screen.
