<div align="center">
<br>
<p align="center">
<img src="docs/elliott.jpg" alt="Elliott" height="124" />
</p>

<p align="center">
Elliott — your portfolio, on your device 💼
</p>
</div>


**Elliott** is a simple way to see everything you hold in one view: stocks, crypto, and savings you describe yourself (like a term deposit). What you type in stays on **your computer**—there is no Elliott account database of your positions. The app only reaches out to **public** price sources so the numbers can update; you stay in control of what gets stored locally.

## Documentation

| Doc | Purpose |
|-----|---------|
| [docs/architecture.md](./docs/architecture.md) | How state, persistence, and market data fit together |
| [docs/constraints.md](./docs/constraints.md) | Hard rules (no app backend, client-side data, allowed sources) |
| [AGENTS.md](./AGENTS.md) | Notes for contributors and coding agents (stack + conventions) |

## Tech stack

- Next.js **16+** (App Router), TypeScript **strict**, React 19  
- Material UI **9** + Emotion + `@mui/material-nextjs` (App Router integration)  
- **Jotai** — portfolio + UI state  
- **TanStack Query** — network caching and refetch for quotes and charts  
- **idb** — IndexedDB (portfolio + cached quote snapshots)  
- **lightweight-charts** — price charts  

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment

Copy `env.example` to `.env.local` and set only what you need:

```bash
cp env.example .env.local
```

| Variable | Why |
|----------|-----|
| `NEXT_PUBLIC_TWELVEDATA_API_KEY` | Stronger equity quotes/charts than the public demo key |
| `NEXT_PUBLIC_IOL_LISTING_EXCHANGES` | Comma-separated venues for IOL-first quotes/charts (default: BCBA, NYSE, NASDAQ, AMEX, ARCA, BATS). Set empty to disable IOL-first for all. |
| `NEXT_PUBLIC_CORSFIX_API_KEY` | Helps load **IOL** listing pages from the browser when plain `fetch` is blocked |
| `NEXT_PUBLIC_IOL_UDF_CHARTS` | Set to `0` to skip IOL UDF daily charts for exchanges in the IOL listing list (TwelveData-only path). `NEXT_PUBLIC_BCBA_IOL_CHARTS=0` is still honored as an opt-out. |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Production server |
| `npm run lint` | ESLint |
| `npm run test` | Vitest (unit tests) |

## Features (current)

1. Portfolio **add / edit / delete** with automatic save in the browser  
2. **Live-style prices** (polling + optional IndexedDB cache for last-known values)  
3. **KPIs**: total value, optional gain/loss vs average cost, estimated 24h change, allocation  
4. **Charts** per holding (crypto and equity sources; IOL-listed exchanges can use IOL daily history before TwelveData)  
5. **Opportunity hints** from small, documented rules (concentration, moves, drawdown vs cost)  
6. **Fixed income** positions modeled from your own rate and dates (no external feed)  

## License

Private project (`private: true` in `package.json`); adjust as needed.
