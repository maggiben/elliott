<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Elliott — agent & contributor guide

Use this file together with **[docs/architecture.md](./docs/architecture.md)** and **[docs/constraints.md](./docs/constraints.md)**. Those documents are the source of truth for structure and non-negotiable rules.

## Product summary

**Elliott** is a portfolio tracker with **no server database**: portfolio rows live in **Jotai** and **IndexedDB**. Market data uses **React Query**; **CoinGecko** and **Binance** are called from the browser where allowed. **TwelveData** and **IOL** listing/UDF fetches go through **Next.js Route Handlers** (`src/app/api/market/`) so **`TWELVEDATA_API_KEY`** and **`CORSFIX_API_KEY`** stay server-side. Equities with an **exchange** try **InvertirOnline** first when the venue is in **`IOL_LISTING_EXCHANGES`** (server config; defaults include BCBA, NYSE, NASDAQ, AMEX, ARCA, BATS), then TwelveData (see `src/lib/providers/listing-html-bcba/`). **Fixed income** rows use **synthetic** quotes from user-entered fields. Last-known quotes and FX helpers can persist in **IndexedDB** (`market-cache-db.ts`).

## Non-negotiable constraints

- **No app-owned database**; portfolio data stays client-side.
- **All durable user data client-side** (IndexedDB preferred).
- **Allowed data paths** per [docs/constraints.md](./docs/constraints.md) — do not add vendors or private APIs without revising constraints.
- **Separate** portfolio state (Jotai), market data (React Query + normalized model), UI state (Jotai).

## Where to change what

| Task | Location |
|------|----------|
| Portfolio shape / CRUD helpers | `src/lib/portfolio/` |
| Jotai atoms | `src/state/portfolio-atoms.ts`, `src/state/ui-atoms.ts` |
| IndexedDB schema / keys | `src/lib/storage/portfolio-db.ts`, `src/lib/storage/market-cache-db.ts` |
| Unified market types | `src/lib/market-data/types.ts` |
| API → `MarketData` mapping | `src/lib/market-data/normalize.ts` |
| Browser market HTTP | `src/lib/api/coingecko.ts`, `binance.ts`, `market-api-client.ts` |
| Server market HTTP + keys | `src/lib/server/*`, `src/app/api/market/*` |
| IOL listing / UDF providers (env-driven exchange list) | `src/lib/providers/listing-html-bcba/` |
| Quote orchestration | `src/lib/quotes/fetch-portfolio-quotes.ts`, `build-fixed-income-quote.ts` |
| React Query keys / hooks | `src/lib/queries/` |
| KPI math | `src/lib/calculations/portfolio-kpis.ts` |
| Opportunity rules | `src/lib/opportunities/rules.ts` |
| MUI theme | `src/theme/mui-theme.ts` |
| Providers (Query + MUI + persistence) | `src/components/providers/` |

## Conventions

- **Typing**: strict TypeScript; prefer small pure functions for calculations.
- **Components**: keep them small and composable; dashboard orchestrates, it should not own low-level fetch logic.
- **MUI v9**: layout props often belong in **`sx`** (e.g. `Box`, `Stack` flex) rather than deprecated system props on some components.
- **Re-renders**: memoize heavy children where it matters (`memo`, `useMemo` for derived maps like `quotes`).
- **Secrets / market config**: `TWELVEDATA_API_KEY`, `CORSFIX_API_KEY`, `IOL_LISTING_EXCHANGES`, and `IOL_UDF_CHARTS` are server-only env vars.

## APIs and browser limits

- Expect **Binance** to often fail from the browser (**CORS**); **CoinGecko** is the reliable crypto path.
- **TwelveData** equity charts/quotes may rate-limit or fail with the demo key; UI should stay usable.
- **IOL listing HTML / UDF** are crawled on the server (direct fetch, then **Corsfix**); keep vendor-specific logic in `lib/providers/` so it can be replaced.

## Verification

After substantive changes:

```bash
npm run lint
npm run build
```

## Cross-reference

- [README.md](./README.md) — quick start and doc index  
- [docs/architecture.md](./docs/architecture.md) — diagrams and data flow  
- [docs/constraints.md](./docs/constraints.md) — hard constraints  
