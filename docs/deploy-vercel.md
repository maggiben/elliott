# Deploy Elliott to Vercel

Elliott is a Next.js app with **no server database**: portfolio data stays in each visitor’s browser (IndexedDB). Vercel runs `next build` and serves the app plus **Route Handlers** under `/api/market/*` for TwelveData and IOL (API keys stay on the server).

## Prerequisites

- A [Vercel](https://vercel.com) account
- This repo connected to Vercel (GitHub/GitLab/Bitbucket import, or CLI)
- Optional API keys for TwelveData and Corsfix (see [env.example](../env.example))

## 1. Keep secrets out of Git

These paths are already ignored (see `.gitignore`):

- `.env`, `.env.local`, `.env.production`, etc.
- `.vercel` (local CLI link metadata)

CLI deploys also exclude env files via [`.vercelignore`](../.vercelignore) so your laptop’s `.env` is not uploaded with the source bundle.

**Do not** commit real keys. Only [env.example](../env.example) belongs in the repo (empty placeholders).

For local development, copy the example file:

```bash
cp env.example .env.local
```

Edit `.env.local` with your keys. Next.js loads `.env.local` in development and does not commit it.

## 2. Set environment variables on Vercel

In the Vercel project: **Settings → Environment Variables**, add the same names as in `env.example`. Apply them to **Production** (and **Preview** if you use preview deployments).

| Variable | Required | Notes |
|----------|----------|--------|
| `TWELVEDATA_API_KEY` | No | Omit or leave empty to use TwelveData’s public `demo` key (rate limits). |
| `CORSFIX_API_KEY` | No | Improves IOL listing/UDF when server direct fetch fails. |
| `IOL_LISTING_EXCHANGES` | No | Unset = default venues (BCBA, NYSE, NASDAQ, AMEX, ARCA, BATS). Set to empty string to disable IOL-first routing. |
| `IOL_UDF_CHARTS` | No | Set to `0` to skip IOL UDF charts (TwelveData-only for those exchanges). |
| `BCBA_IOL_CHARTS` | No | Legacy alias; `0` has the same effect as `IOL_UDF_CHARTS=0`. |

After changing variables, **redeploy** so the build embeds the new values.

### Important: server-only env vars

`TWELVEDATA_API_KEY`, `CORSFIX_API_KEY`, and IOL config vars are read only on the server and are **not** inlined into the browser bundle. Do not prefix them with `NEXT_PUBLIC_`.

## 3. Deploy

### Git integration (recommended)

1. Import the repository in Vercel.
2. Framework preset: **Next.js** (auto-detected).
3. Build command: `npm run build` (default).
4. Output: managed by Next.js (no custom `output: 'export'` required).
5. Install command: `npm install` (default).
6. Add environment variables (step 2), then deploy.

### Vercel CLI (optional)

```bash
npm i -g vercel
vercel login
vercel link          # once per machine
vercel env pull .env.local   # optional: sync Vercel env into local file (do not commit)
vercel --prod
```

## 4. Verify after deploy

1. Open the production URL; add a test position and confirm IndexedDB persistence (refresh the page).
2. Check equity quotes (TwelveData / IOL paths) and crypto (CoinGecko).
3. If BCBA or IOL-listed symbols fail, confirm `CORSFIX_API_KEY` is set on Vercel and redeploy; check Network tab for `/api/market/iol/*` responses.
4. Run locally before pushing: `npm run lint` and `npm run build`.

## 5. Security checklist

- [ ] No `.env` or `.env.local` with real keys in Git (`git status` clean; never `git add .env*`).
- [ ] Keys set only in Vercel (or local `.env.local`), not in README or issues.
- [ ] Rotate TwelveData / Corsfix keys if they were ever committed or shared publicly.
- [ ] Market env vars use server names only (no `NEXT_PUBLIC_*` for keys or IOL config).

## Troubleshooting

| Symptom | Likely cause |
|---------|----------------|
| Build fails on Vercel | Run `npm run build` locally (Turbopack is the default in Next.js 16). Fix TypeScript/ESLint errors first. If you see a vague `path` / `Received undefined` error after a dependency upgrade, try **Deployments → … → Redeploy** with **Clear build cache** enabled. |
| Env vars ignored | Redeploy after changing variables; names must match exactly (no `NEXT_PUBLIC_` prefix for market vars). |
| IOL / BCBA quotes empty | Missing/invalid `CORSFIX_API_KEY`; IOL HTML/parser changes; check `/api/market/iol/listing`. |
| Equity charts rate-limited | TwelveData demo key; add `TWELVEDATA_API_KEY`. |
| Binance errors in console | Expected in browser (CORS); crypto should still work via CoinGecko. |

## Related docs

- [README.md](../README.md) — env variable summary
- [constraints.md](./constraints.md) — no backend, allowed data sources
- [architecture.md](./architecture.md) — data flow
