# StockPilot API

Backend for StockPilot: a multi-tenant inventory/POS system. Each business ("tenant") has one owner account and any number of seller accounts, all scoped to that business.

## Setup

1. `npm install`
2. Copy `.env.example` to `.env` and fill in:
   - `DATABASE_URL` — a Postgres connection string (e.g. a Supabase project)
   - `JWT_SECRET` — any long random string
3. Push the schema to your database: `npm run db:push`
4. Start the dev server: `npm run dev`

The API listens on `http://localhost:4000` by default (`PORT` in `.env` to change it).

## Core concepts

- **Business** — the tenant. Created automatically when an owner registers.
- **Owner** — logs in with phone + password. Manages products, sellers, restocks, and sees reports.
- **Seller** — logs in with phone + a short PIN the owner sets for them. Can look up products by barcode and record sales.
- Every business-scoped table (`products`, `restocks`, `sales`, seller `users`) is filtered by the authenticated user's `businessId`, so one business can never see another's data.

## Typical flow

1. `POST /auth/register-owner` — creates the business + owner account.
2. `POST /products` (owner) — add a product with its barcode, cost price, and sell price.
3. `POST /restocks` (owner) — scan the barcode, log quantity + cost per unit; increases stock and the business's total investment.
4. `POST /sellers` (owner) — create a seller account (name, phone, PIN).
5. `POST /auth/login-seller` — seller logs in with phone + PIN.
6. `POST /sales` (owner or seller) — scan the barcode, log a sale; decreases stock and is attributed to whoever is logged in.
7. `GET /reports/summary` (owner) — total investment, total sales, profit, current stock value, and a per-seller sales breakdown.

## Auth

Short-lived JWT access tokens (15 min) plus rotating refresh tokens (30 days, revocable, stored hashed in the `refresh_tokens` table). Call `POST /auth/refresh` with the current refresh token to get a new pair before the access token expires.

## Routes

| Method | Path                  | Who           | Purpose                              |
|--------|-----------------------|---------------|---------------------------------------|
| POST   | /auth/register-owner  | anyone        | Create a business + owner account     |
| POST   | /auth/login-owner     | anyone        | Owner login (phone + password)        |
| POST   | /auth/login-seller    | anyone        | Seller login (phone + PIN)            |
| POST   | /auth/refresh         | anyone        | Rotate a refresh token                |
| POST   | /auth/logout          | anyone        | Revoke a refresh token                |
| GET    | /auth/me              | signed in     | Restore the current user/business (e.g. after app restart) |
| GET    | /products             | owner/seller  | List products                         |
| GET    | /products/barcode/:code | owner/seller | Look up a product by scanned barcode |
| POST   | /products             | owner         | Create a product                      |
| PATCH  | /products/:id         | owner         | Edit a product                        |
| POST   | /restocks              | owner         | Record a restock                      |
| GET    | /restocks              | owner         | List restocks                         |
| POST   | /sales                | owner/seller  | Record a sale                         |
| GET    | /sales                | owner/seller  | List sales (sellers see only their own) |
| GET    | /sellers               | owner         | List seller accounts                  |
| POST   | /sellers               | owner         | Create a seller account               |
| DELETE | /sellers/:id           | owner         | Remove a seller account               |
| GET    | /reports/summary       | owner         | Investment, sales, profit, per-seller stats |
