<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Elliott — agent & contributor guide

Use this file together with **[docs/architecture.md](./docs/architecture.md)** and **[docs/constraints.md](./docs/constraints.md)**. Those documents are the source of truth for structure and non-negotiable rules.

## Product summary

**Elliott** is a client-only portfolio tracker: no backend, no server database. Portfolio rows live in **Jotai** and **IndexedDB**; market data is fetched via **React Query** from **CoinGecko**, **Binance**, **TwelveData**, then normalized to **`MarketData`**.

## Non-negotiable constraints

- **No backend** for core behavior; no app-owned database.
- **All durable user data client-side** (IndexedDB preferred).
- **Only** CoinGecko, Binance (public), TwelveData
- **Separate** portfolio state (Jotai), market data (React Query + normalized model), UI state (Jotai).

Full list: [docs/constraints.md](./docs/constraints.md).

## Where to change what

| Task | Location |
|------|----------|
| Portfolio shape / CRUD helpers | `src/lib/portfolio/` |
| Jotai atoms | `src/state/portfolio-atoms.ts`, `src/state/ui-atoms.ts` |
| IndexedDB schema / keys | `src/lib/storage/portfolio-db.ts` |
| Unified market types | `src/lib/market-data/types.ts` |
| API → `MarketData` mapping | `src/lib/market-data/normalize.ts` |
| Raw HTTP | `src/lib/api/*.ts` |
| Quote orchestration | `src/lib/quotes/fetch-portfolio-quotes.ts` |
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
- **Secrets**: never put private keys in `NEXT_PUBLIC_*`; Elliott only exposes optional TwelveData key because there is no server vault.

## APIs and browser limits

- Expect **Binance** to often fail from the browser (**CORS**); **CoinGecko** is the reliable crypto path.
- **TwelveData** equity charts/quotes may rate-limit or fail with the demo key; UI should stay usable.

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
