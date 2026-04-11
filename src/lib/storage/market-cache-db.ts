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
