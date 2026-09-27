# StockPilot

Multi-tenant inventory & point-of-sale system for small businesses. An owner adds products and assigns each a barcode; restocking is "scan the barcode, enter quantity and cost." Sellers each have their own account, scan a barcode to record a sale, and the owner sees stock levels, per-seller sales, profit, and total investment from one dashboard.

## Structure

- `server/` — Node/TypeScript backend (Express + Drizzle ORM + Postgres). See `server/README.md`.
- `mobile/` — React Native (Expo) app for owners and sellers. See `mobile/README.md`.

## Status

Both the backend and the mobile app are built and verified end-to-end: register a business, add a product with a barcode, restock it, add a seller, sign in as that seller, scan and record a sale, and view the owner's reports dashboard (investment, sales, profit, stock value, per-seller totals) all work correctly against a live database.

Verified via Expo's web preview (`expo start --web`) plus a live camera check, since this environment has no iOS/Android simulator. Barcode *decoding* against a real printed barcode still needs a real device or Expo Go — the camera permission flow and live preview are confirmed working, but scanning an actual barcode hasn't been tested outside a browser's fake camera feed.

### Note on version control

`mobile/` has its own git repo (auto-created by the Expo scaffolding tool, one untouched "Initial commit"). `server/` and the top-level folder aren't version-controlled yet. Worth deciding how you want this organized (one repo for the whole project vs. separate repos per app) before pushing anywhere.
