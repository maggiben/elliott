import type { MarketData, QuoteKey } from "@/lib/market-data/types";
import { positionQuoteKey } from "@/lib/market-data/types";
import type { PortfolioPosition } from "@/lib/portfolio/types";
import { getDb } from "./market-cache-db";

/** Minimum interval between network fetches for the same market bucket (survives reload). */
export const MARKET_FETCH_TTL_MS = 60_000;

const STORE = "kv";
const FETCH_META_KEY = "market-fetch-meta-v1";

type FetchMeta = {
  quotes?: number;
  exchangeRates?: number;
  charts: Record<string, number>;
};

function emptyMeta(): FetchMeta {
  return { charts: {} };
}

function isFetchMeta(x: unknown): x is FetchMeta {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  if (o.quotes !== undefined && typeof o.quotes !== "number") return false;
  if (
    o.exchangeRates !== undefined &&
    typeof o.exchangeRates !== "number"
  ) {
    return false;
  }
  if (!o.charts || typeof o.charts !== "object") return false;
  return true;
}

async function loadFetchMeta(): Promise<FetchMeta> {
  try {
    const db = await getDb();
    const raw = await db.get(STORE, FETCH_META_KEY);
    if (!isFetchMeta(raw)) return emptyMeta();
    return { ...emptyMeta(), ...raw, charts: { ...raw.charts } };
  } catch {
    return emptyMeta();
  }
}

async function saveFetchMeta(meta: FetchMeta): Promise<void> {
  try {
    const db = await getDb();
    await db.put(STORE, meta, FETCH_META_KEY);
  } catch {
    /* ignore */
  }
}

export function isWithinMarketFetchTtl(
  fetchedAtMs: number | undefined,
  nowMs: number = Date.now(),
): boolean {
  if (fetchedAtMs === undefined || !Number.isFinite(fetchedAtMs)) {
    return false;
  }
  return nowMs - fetchedAtMs < MARKET_FETCH_TTL_MS;
}

/** Skip quote APIs when a recent successful fetch covered all non–fixed-income keys. */
export function portfolioQuotesNeedNetworkFetch(
  positions: PortfolioPosition[],
  cached: Record<QuoteKey, MarketData>,
  quotesFetchedAtMs: number | undefined,
  nowMs: number = Date.now(),
): boolean {
  if (!isWithinMarketFetchTtl(quotesFetchedAtMs, nowMs)) return true;
  const seen = new Set<QuoteKey>();
  for (const p of positions) {
    if (p.kind === "fixed_income") continue;
    const k = positionQuoteKey(p);
    if (seen.has(k)) continue;
    seen.add(k);
    if (!cached[k]) return true;
  }
  return false;
}

export async function getQuotesFetchedAt(): Promise<number | undefined> {
  const meta = await loadFetchMeta();
  return meta.quotes;
}

export async function touchQuotesFetchedAt(
  atMs: number = Date.now(),
): Promise<void> {
  const meta = await loadFetchMeta();
  await saveFetchMeta({ ...meta, quotes: atMs });
}

export async function getExchangeRatesFetchedAt(): Promise<number | undefined> {
  const meta = await loadFetchMeta();
  return meta.exchangeRates;
}

export async function touchExchangeRatesFetchedAt(
  atMs: number = Date.now(),
): Promise<void> {
  const meta = await loadFetchMeta();
  await saveFetchMeta({ ...meta, exchangeRates: atMs });
}

export async function getChartSeriesFetchedAt(
  cacheKey: string,
): Promise<number | undefined> {
  const meta = await loadFetchMeta();
  return meta.charts[cacheKey];
}

export async function touchChartSeriesFetchedAt(
  cacheKey: string,
  atMs: number = Date.now(),
): Promise<void> {
  const meta = await loadFetchMeta();
  await saveFetchMeta({
    ...meta,
    charts: { ...meta.charts, [cacheKey]: atMs },
  });
}
