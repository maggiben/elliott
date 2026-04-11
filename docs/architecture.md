# Elliott — architecture

Elliott is a **client-side portfolio tracker**: holdings and preferences stay in the browser; market data is fetched from public HTTP APIs and normalized into one model.

## High-level diagram

```mermaid
flowchart TB
  subgraph ui [UI Layer]
    Dashboard[Dashboard / components]
  end
  subgraph state [Client state]
    JotaiPortfolio[Jotai portfolioAtom]
    JotaiUI[Jotai UI atoms]
    RQ[React Query cache]
  end
  subgraph persist [Persistence]
    IDB[(IndexedDB)]
  end
  subgraph network [Public APIs]
    CG[CoinGecko]
    BN[Binance]
    TD[TwelveData]
  end
  Dashboard --> JotaiPortfolio
  Dashboard --> JotaiUI
  Dashboard --> RQ
  JotaiPortfolio --> IDB
  RQ --> CG
  RQ --> BN
  RQ --> TD
```

## State separation

| State type | Mechanism | Examples |
|------------|-----------|----------|
| **Portfolio** | Jotai + IndexedDB | Positions, quantities, avg cost, labels |
| **Market data** | React Query | Quotes, chart series; keyed and refetched on an interval |
| **UI** | Jotai (no persistence) | Selected chart symbol, chart horizon, dialog open/edit |

Portfolio mutations go through **pure helpers** in `src/lib/portfolio/mutations.ts` and `setPortfolio` on the atom. Persistence runs in `PortfolioPersistence` (debounced writes after hydration).

## Data pipeline (market)

1. **Raw fetch** — `src/lib/api/coingecko.ts`, `binance.ts`, `twelvedata.ts`.
2. **Orchestration** — `src/lib/quotes/fetch-portfolio-quotes.ts` chooses source by `AssetKind` (`crypto` vs `equity`) and applies Binance → CoinGecko fallback for crypto.
3. **Normalization** — `src/lib/market-data/normalize.ts` builds `MarketData` with a single shape (price, optional 24h %, source, `externalId` for charts when available).
4. **Addressing quotes** — `quoteKey(kind, symbol)` in `src/lib/market-data/types.ts` keys the quote map as `` `${kind}:${SYMBOL}` `` to avoid collisions across asset classes.

## React Query

- **Query key factory**: `src/lib/queries/keys.ts`.
- **Hooks**: `use-portfolio-quotes.ts`, `use-chart-series.ts` (`"use client"`).
- Policies: modest `staleTime`, interval refetch for live quotes, no aggressive `refetchOnWindowFocus` by default (see `AppProviders`).

## Calculations and rules

- **KPIs**: `src/lib/calculations/portfolio-kpis.ts` — totals, optional cost-basis PnL, value-weighted 24h estimate, allocation weights.
- **Opportunities**: `src/lib/opportunities/rules.ts` — deterministic, explainable rules (concentration, 24h moves, book-level drawdown vs cost).

## UI composition

- **Shell**: `src/components/layout/app-shell.tsx` — app bar, primary actions.
- **Dashboard**: `src/components/dashboard/dashboard.tsx` — wires KPIs, table, allocation, opportunities, chart.
- **Charts**: TradingView **Lightweight Charts** in `src/components/charts/price-chart.tsx` (client-only chart lifecycle).

## Folder map

```
src/
  app/                 # Next.js routes, layout, global CSS
  components/        # Feature UI (dashboard, portfolio, charts, providers)
  lib/
    api/               # Raw HTTP clients
    calculations/      # KPI math
    format/            # Display helpers
    market-data/       # Types + normalizers
    opportunities/     # Alert rules
    portfolio/         # Position types + CRUD helpers
    queries/           # React Query hooks + keys
    quotes/            # Multi-source quote orchestration
    storage/           # IndexedDB access
    utils/             # Small shared helpers
  state/               # Jotai atoms (portfolio vs UI)
  theme/               # MUI theme
```

## Extension points

- **New asset class**: extend `AssetKind`, add normalizer + fetch path in `fetch-portfolio-quotes.ts`, update UI labels — only if still within [constraints](./constraints.md).
- **New KPI**: add a pure function under `lib/calculations/` and consume in the dashboard.
- **New opportunity rule**: add a branch in `lib/opportunities/rules.ts` with a stable `id` for list keys.

## Related docs

- [Constraints](./constraints.md) — non-negotiable product and technical limits.
- [AGENTS.md](../AGENTS.md) — guidance for automated agents and contributors.
