import { openDB, type IDBPDatabase } from "idb";
import type { MarketData, QuoteKey } from "@/lib/market-data/types";
import { positionQuoteKey } from "@/lib/market-data/types";
import type { PortfolioPosition } from "@/lib/portfolio/types";

/** Same IndexedDB as portfolio — separate kv keys for market snapshots. */
const DB = "elliott-portfolio";
const VERSION = 1;
const STORE = "kv";
const QUOTES_CACHE_KEY = "market-quotes-v1";
const EXCHANGE_RATES_KEY = "market-exchange-rates-v1";

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB, VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE);
        }
      },
    });
  }
  return dbPromise;
}

export async function loadQuotesCache(): Promise<Record<QuoteKey, MarketData>> {
  try {
    const db = await getDb();
    const raw = await db.get(STORE, QUOTES_CACHE_KEY);
    if (!raw || typeof raw !== "object") return {};
    return raw as Record<QuoteKey, MarketData>;
  } catch {
    return {};
  }
}

export async function saveQuotesCacheMerge(
  partial: Record<QuoteKey, MarketData>,
): Promise<void> {
  if (Object.keys(partial).length === 0) return;
  try {
    const db = await getDb();
    const existing = (await db.get(STORE, QUOTES_CACHE_KEY)) as
      | Record<QuoteKey, MarketData>
      | undefined;
    const base =
      existing && typeof existing === "object" ? existing : {};
    await db.put(STORE, { ...base, ...partial }, QUOTES_CACHE_KEY);
  } catch {
    /* ignore */
  }
}

export function quotesSubsetForPositions(
  entries: Record<QuoteKey, MarketData>,
  positions: PortfolioPosition[],
): Record<QuoteKey, MarketData> {
  const out: Record<QuoteKey, MarketData> = {};
  const seen = new Set<QuoteKey>();
  for (const p of positions) {
    const k = positionQuoteKey(p);
    if (seen.has(k)) continue;
    seen.add(k);
    const row = entries[k];
    if (row) out[k] = row;
  }
  return out;
}

export async function loadExchangeRatesCache(): Promise<
  Record<string, number>
> {
  try {
    const db = await getDb();
    const raw = await db.get(STORE, EXCHANGE_RATES_KEY);
    if (!raw || typeof raw !== "object") return {};
    return raw as Record<string, number>;
  } catch {
    return {};
  }
}

export async function saveExchangeRatesCacheMerge(
  partial: Record<string, number>,
): Promise<void> {
  if (Object.keys(partial).length === 0) return;
  try {
    const db = await getDb();
    const existing = (await db.get(STORE, EXCHANGE_RATES_KEY)) as
      | Record<string, number>
      | undefined;
    const base =
      existing && typeof existing === "object" ? existing : {};
    await db.put(STORE, { ...base, ...partial }, EXCHANGE_RATES_KEY);
  } catch {
    /* ignore */
  }
}

/** One candle for lightweight-charts (daily buckets). */
export type ChartPoint = { timeSec: number; value: number };

const CHART_SERIES_PREFIX = "market-chart-series-v1:";

function isChartPoint(x: unknown): x is ChartPoint {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.timeSec === "number" &&
    Number.isFinite(o.timeSec) &&
    typeof o.value === "number" &&
    Number.isFinite(o.value)
  );
}

export function chartCacheKeyCrypto(symbol: string, days: number): string {
  return `c:${symbol.trim().toUpperCase()}:${days}`;
}

export function chartCacheKeyEquity(
  symbol: string,
  days: number,
  exchange?: string,
): string {
  const ex = (exchange?.trim().toUpperCase() ?? "") || "_";
  return `e:${symbol.trim().toUpperCase()}:${ex}:${days}`;
}

export async function loadChartSeriesForKey(
  cacheKey: string,
): Promise<ChartPoint[]> {
  try {
    const db = await getDb();
    const raw = await db.get(STORE, CHART_SERIES_PREFIX + cacheKey);
    if (!Array.isArray(raw)) return [];
    return raw.filter(isChartPoint);
  } catch {
    return [];
  }
}

export async function saveChartSeriesForKey(
  cacheKey: string,
  points: ChartPoint[],
): Promise<void> {
  if (points.length === 0) return;
  try {
    const db = await getDb();
    await db.put(STORE, points, CHART_SERIES_PREFIX + cacheKey);
  } catch {
    /* ignore */
  }
}

/** Replaces the entire quotes snapshot (e.g. after restoring a backup). */
export async function replaceQuotesCache(
  entries: Record<QuoteKey, MarketData>,
): Promise<void> {
  const db = await getDb();
  await db.put(STORE, entries, QUOTES_CACHE_KEY);
}

/** Replaces cached FX table used for book-currency conversion. */
export async function replaceExchangeRatesCache(
  rates: Record<string, number>,
): Promise<void> {
  const db = await getDb();
  await db.put(STORE, rates, EXCHANGE_RATES_KEY);
}

export function invalidateElliottMarketCacheDbConnection(): void {
  dbPromise = null;
}

const NET_WORTH_HISTORY_KEY = "net-worth-history-v1";

/** One observed book-total sample (local only; no historical market API). */
export type NetWorthHistoryPoint = {
  t: number;
  value: number;
  /** Uppercased book currency at sample time. */
  currency: string;
};

export function utcDayKey(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/**
 * Keeps at most one point per UTC calendar day (latest wins for that day),
 * sorted by time ascending, capped at `maxPoints` (oldest dropped).
 */
export function mergeNetWorthDailySample(
  existing: NetWorthHistoryPoint[],
  next: NetWorthHistoryPoint,
  opts: { maxPoints: number },
): NetWorthHistoryPoint[] {
  const day = utcDayKey(next.t);
  const withoutDay = existing.filter((p) => utcDayKey(p.t) !== day);
  const merged = [...withoutDay, next].sort((a, b) => a.t - b.t);
  if (merged.length > opts.maxPoints) {
    return merged.slice(merged.length - opts.maxPoints);
  }
  return merged;
}

function isNetWorthHistoryPoint(x: unknown): x is NetWorthHistoryPoint {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.t === "number" &&
    Number.isFinite(o.t) &&
    typeof o.value === "number" &&
    Number.isFinite(o.value) &&
    typeof o.currency === "string" &&
    o.currency.trim().length > 0
  );
}

export async function loadNetWorthHistory(): Promise<NetWorthHistoryPoint[]> {
  try {
    const db = await getDb();
    const raw = await db.get(STORE, NET_WORTH_HISTORY_KEY);
    if (!Array.isArray(raw)) return [];
    return raw.filter(isNetWorthHistoryPoint).map((p) => ({
      ...p,
      currency: p.currency.trim().toUpperCase(),
    }));
  } catch {
    return [];
  }
}

export async function saveNetWorthHistory(
  points: NetWorthHistoryPoint[],
): Promise<void> {
  try {
    const db = await getDb();
    await db.put(STORE, points, NET_WORTH_HISTORY_KEY);
  } catch {
    /* ignore */
  }
}
