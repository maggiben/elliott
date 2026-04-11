# Elliott — constraints

Hard rules for this codebase. If a change violates these, it is out of scope unless the constraints are explicitly revised.

## Platform

| Constraint | Detail |
|------------|--------|
| **No backend** | No custom API routes for app logic, no server-only database, no deployed server this app depends on for core features. The app is a static/edge-friendly Next.js client bundle. |
| **No database** | No Postgres, SQLite server, etc. All durable state is **client-side**. |
| **Client-side persistence** | Portfolio and similar user data use the **browser** (IndexedDB via `idb`). Prefer IndexedDB over `localStorage` for structured data and size. |
| **Public APIs only** | Market data must come from **CoinGecko**, **Binance** (public REST), and **TwelveData**. Do not add other paid or private data vendors without an explicit decision. |

## Security and secrets

- Anything prefixed with `NEXT_PUBLIC_` is exposed to the browser. Do not put secrets there.
- TwelveData keys are optional and use `NEXT_PUBLIC_TWELVEDATA_API_KEY` only because there is no backend to hold a private key; document the tradeoff for users.

## Architecture (enforced patterns)

| Concern | Where it lives |
|---------|----------------|
| **Portfolio / holdings** | Jotai atoms (`src/state/portfolio-atoms.ts`) + IndexedDB sync |
| **Market fetches** | React Query only (`src/lib/queries/`) |
| **Unified market shape** | `MarketData` in `src/lib/market-data/types.ts` after normalization |
| **UI-only state** | Jotai (`src/state/ui-atoms.ts`) — chart selection, dialog, chart range |

## UI product constraints

- **Dark-first** minimalist UI (MUI theme in `src/theme/mui-theme.ts`).
- **Responsive** layouts; avoid desktop-only assumptions.

## What “no backend” still allows

- Next.js **App Router** and **server components** for layout/shell are fine if they do not become a substitute for a data API (no secrets, no proxying private APIs without an explicit exception).
- **Route Handlers** are discouraged for core Elliott behavior; prefer direct browser calls to the allowed public APIs.

## CORS reality

- **CoinGecko** is generally callable from the browser.
- **Binance** public REST often **fails in the browser** due to CORS; the app tries Binance then **falls back to CoinGecko**.
- **TwelveData** depends on their CORS policy and key tier; failures should degrade gracefully in the UI.
