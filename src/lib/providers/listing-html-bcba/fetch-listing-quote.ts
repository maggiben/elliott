import { fetchMarketListingQuote } from "@/lib/api/market-api-client";
import type { MarketData } from "@/lib/market-data/types";

/**
 * Spot quote from IOL listing HTML via `/api/market/iol/listing`.
 * Server applies exchange allowlist and crawling.
 */
export async function fetchIolListingHtmlQuote(
  symbol: string,
  exchange: string,
  signal?: AbortSignal,
): Promise<MarketData | null> {
  const sym = symbol.trim().toUpperCase();
  const ex = exchange.trim().toUpperCase();
  if (!sym || !ex) return null;

  const body = await fetchMarketListingQuote(sym, ex, signal);
  return body?.data ?? null;
}
