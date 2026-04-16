# Elliott — constraints

Hard rules for this codebase. If a change violates these, it is out of scope unless the constraints are explicitly revised.

## Platform

| Constraint | Detail |
|------------|--------|
| **No backend** | No custom API routes for app logic, no server-only database, no deployed server this app depends on for core features. The app is a static/edge-friendly Next.js client bundle. |
| **No database** | No Postgres, SQLite server, etc. All durable state is **client-side**. |
| **Client-side persistence** | Portfolio, cached quote snapshots, and related keys use the **browser** (IndexedDB via `idb`). Prefer IndexedDB over `localStorage` for structured data and size. |
| **Allowed market inputs** | **CoinGecko**, **Binance** (public REST), and **TwelveData** for normalized market data. Configured listing venues (default: BCBA, NYSE, NASDAQ, AMEX, ARCA, BATS; see `NEXT_PUBLIC_IOL_LISTING_EXCHANGES`) may use **InvertirOnline** public listing HTML and UDF JSON on `iol.invertironline.com` (implementation under `src/lib/providers/listing-html-bcba/`, Corsfix when needed). **Fixed income** positions use **only** user-entered fields (rate, dates, currency)—no external quote. Do not add other paid or private data vendors without an explicit decision. |

## Third-party browser proxy (CORS)

- Listing HTML and some chart paths may call targets through **Corsfix** (`src/lib/api/corsfix.ts`) so the browser can reach pages that do not send CORS headers. That is a **hosted third-party proxy**, not an Elliott-owned backend.
- Optional `NEXT_PUBLIC_CORSFIX_API_KEY` follows the same exposure rules as other `NEXT_PUBLIC_*` variables.

## Security and secrets

- Anything prefixed with `NEXT_PUBLIC_` is exposed to the browser. Do not put secrets there.
- TwelveData keys are optional and use `NEXT_PUBLIC_TWELVEDATA_API_KEY` only because there is no backend to hold a private key; document the tradeoff for users.

## Architecture (enforced patterns)

| Concern | Where it lives |
|---------|----------------|
| **Portfolio / holdings** | Jotai atoms (`src/state/portfolio-atoms.ts`) + IndexedDB sync |
| **Market fetches** | React Query (`src/lib/queries/`) |
| **Unified market shape** | `MarketData` in `src/lib/market-data/types.ts` after normalization |
| **Quote cache / FX cache** | `src/lib/storage/market-cache-db.ts` (same DB name as portfolio, separate keys) |
| **Listing HTML providers** | `src/lib/providers/*` (swappable parsers + vendor config) |
| **UI-only state** | Jotai (`src/state/ui-atoms.ts`) — chart selection, dialog, chart range |

## UI product constraints

- **Dark-first** minimalist UI (MUI theme in `src/theme/mui-theme.ts`).
- **Responsive** layouts; avoid desktop-only assumptions.

## What “no backend” still allows

- Next.js **App Router** and **server components** for layout/shell are fine if they do not become a substitute for a data API (no secrets, no proxying private APIs without an explicit exception).
- **Route Handlers** are discouraged for core Elliott behavior; prefer direct browser calls to allowed public endpoints (and documented proxies where needed for CORS).

## CORS reality

- **CoinGecko** is generally callable from the browser.
- **Binance** public REST often **fails in the browser** due to CORS; the app tries Binance then **falls back to CoinGecko**.
- **TwelveData** depends on their CORS policy and key tier; failures should degrade gracefully in the UI.
- **IOL listing HTML / UDF** (venues listed in `NEXT_PUBLIC_IOL_LISTING_EXCHANGES`, or the built-in default set) may require **Corsfix** when the origin does not allow browser `fetch`; without a key or when the proxy fails, those quotes or charts may be empty while **TwelveData** still works as fallback where configured.
