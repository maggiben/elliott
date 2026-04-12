<div align="center">
<br>
<p align="center">
<img src="docs/elliott.jpg" alt="Elliott" height="124" />
</p>

<p align="center">
Elliott, a private portfolio tracker 💼
</p>
</div>


Production-oriented **portfolio tracker** in the browser: holdings in **IndexedDB**, live quotes from **CoinGecko**, **Binance**, and **TwelveData**, UI built with **Next.js (App Router)**, **Material UI**, **Jotai**, and **TanStack Query**. Charts use **TradingView Lightweight Charts**.

## Documentation

| Doc | Purpose |
|-----|---------|
| [docs/architecture.md](./docs/architecture.md) | System design, state split, data flow, folder map |
| [docs/constraints.md](./docs/constraints.md) | Hard rules (no backend/DB, public APIs only, client persistence) |
| [AGENTS.md](./AGENTS.md) | Notes for AI agents and contributors (stack + conventions) |

## Tech stack

- Next.js **16+** (App Router), TypeScript **strict**, React 19  
- Material UI **9** + Emotion + `@mui/material-nextjs` (v16 App Router cache)  
- **Jotai** — portfolio + UI state  
- **TanStack Query** — all network caching/refetch  
- **idb** — IndexedDB wrapper  
- **lightweight-charts** — TradingView charting library  

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment

Copy `env.example` to `.env.local` if you use TwelveData beyond the public demo key:

```bash
cp env.example .env.local
# Edit NEXT_PUBLIC_TWELVEDATA_API_KEY
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |

## Features (current)

1. Portfolio **CRUD** with client persistence  
2. **Live prices** (polling + cache)  
3. **KPIs**: value, optional PnL vs average cost, estimated 24h change, allocation  
4. **Charts** per selected holding (crypto vs equity data sources)  
5. **Opportunity detection** via simple, documented rules  

## License

Private project (`private: true` in `package.json`); adjust as needed.
