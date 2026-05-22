# Elliott — constraints

Hard rules for this codebase. If a change violates these, it is out of scope unless the constraints are explicitly revised.

## Platform

| Constraint | Detail |
|------------|--------|
| **No app-owned database** | No Postgres, SQLite server, etc. All durable portfolio state is **client-side**. |
| **Client-side persistence** | Portfolio, cached quote snapshots, and related keys use the **browser** (IndexedDB via `idb`). Prefer IndexedDB over `localStorage` for structured data and size. |
| **Market API routes** | Next.js **Route Handlers** under `src/app/api/market/` proxy **TwelveData** and **IOL** fetches. API keys and IOL config are **server-only** env vars. Portfolio CRUD does not go through the server. |
| **Allowed market inputs** | **CoinGecko**, **Binance** (public REST, browser), and **TwelveData** (via `/api/market/twelvedata/*`) for normalized market data. Configured listing venues (default: BCBA, NYSE, NASDAQ, AMEX, ARCA, BATS; see `IOL_LISTING_EXCHANGES`) may use **InvertirOnline** listing HTML and UDF JSON via `/api/market/iol/*` (server fetch with Corsfix fallback). **Fixed income** positions use **only** user-entered fields (rate, dates, currency)—no external quote. Do not add other paid or private data vendors without an explicit decision. |

## Third-party proxy (Corsfix)

- IOL listing HTML and UDF history are fetched on the **server** (`src/lib/server/remote-fetch.ts`): direct `fetch` first, then **Corsfix** when needed.
- `CORSFIX_API_KEY`, `IOL_LISTING_EXCHANGES`, and `IOL_UDF_CHARTS` are read only in server code (`src/lib/server/`).

## Security and secrets

- **Do not** use `NEXT_PUBLIC_*` for API keys or market-provider config; Elliott has no required `NEXT_PUBLIC_*` variables.
- Optional keys live in `.env.local` / Vercel as `TWELVEDATA_API_KEY` and `CORSFIX_API_KEY`.

## Architecture (enforced patterns)

| Concern | Where it lives |
|---------|----------------|
| **Portfolio / holdings** | Jotai atoms (`src/state/portfolio-atoms.ts`) + IndexedDB sync |
| **Market fetches (browser)** | React Query (`src/lib/queries/`) → client helpers (`src/lib/api/market-api-client.ts`) |
| **Market fetches (server)** | `src/lib/server/*` + `src/app/api/market/*` |
| **Unified market shape** | `MarketData` in `src/lib/market-data/types.ts` after normalization |
| **Quote cache / FX cache** | `src/lib/storage/market-cache-db.ts` (same DB name as portfolio, separate keys) |
| **Listing HTML providers** | `src/lib/providers/*` (swappable parsers + vendor config) |
| **UI-only state** | Jotai (`src/state/ui-atoms.ts`) — chart selection, dialog, chart range |

## UI product constraints

- **Dark-first** minimalist UI (MUI theme in `src/theme/mui-theme.ts`).
- **Responsive** layouts; avoid desktop-only assumptions.

## What the Next.js server does

- **Route Handlers** for TwelveData and IOL/crawling only; no portfolio storage.
- **Server components** for layout/shell are fine.
- CoinGecko / Binance may still be called from the browser where CORS allows.

## CORS reality

- **CoinGecko** is generally callable from the browser.
- **Binance** public REST often **fails in the browser** due to CORS; the app tries Binance then **falls back to CoinGecko**.
- **TwelveData** and **IOL** go through `/api/market/*` so keys and crawling stay off the client.
- Without `CORSFIX_API_KEY`, server direct fetch may still work for IOL; Corsfix improves reliability when the origin blocks datacenter IPs.
