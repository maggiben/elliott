import {
  normalizeFromBinanceTicker,
  type BinanceTicker24h,
} from "@/lib/market-data/normalize";
import type { MarketData } from "@/lib/market-data/types";

const BASE = "https://api.binance.com/api/v3";

function toUsdtPair(symbol: string): string {
  return `${symbol.trim().toUpperCase()}USDT`;
}

/**
 * Fetches Binance 24h ticker. May fail in the browser when CORS is not allowed;
 * callers should fall back to CoinGecko.
 */
export async function fetchBinanceUsdTicker(
  symbol: string,
  signal?: AbortSignal,
): Promise<MarketData | null> {
  const pair = toUsdtPair(symbol);
  const url = `${BASE}/ticker/24hr?symbol=${encodeURIComponent(pair)}`;
  const res = await fetch(url, { signal });
  if (!res.ok) return null;
  const json = (await res.json()) as BinanceTicker24h;
  return normalizeFromBinanceTicker(json, symbol);
}
