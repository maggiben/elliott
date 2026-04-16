import { fetchViaCorsfix } from "@/lib/api/corsfix";
import { normalizeFromListingHtmlQuote } from "@/lib/market-data/normalize";
import type { MarketData } from "@/lib/market-data/types";
import { isIolListingPreferredExchange, listingQuotePageUrl } from "./vendor-config";
import { parseListingHtmlQuote } from "./parse-listing-html";

/**
 * Spot quote from IOL's public listing HTML (`/titulo/cotizacion/{exchange}/{symbol}`).
 * Used for venues in `isIolListingPreferredExchange` before TwelveData.
 */
export async function fetchIolListingHtmlQuote(
  symbol: string,
  exchange: string,
  signal?: AbortSignal,
): Promise<MarketData | null> {
  const sym = symbol.trim().toUpperCase();
  const ex = exchange.trim().toUpperCase();
  if (!sym || !ex) return null;
  if (!isIolListingPreferredExchange(ex)) return null;

  const targetUrl = listingQuotePageUrl(ex, sym);
  let res: Response;
  try {
    res = await fetchViaCorsfix(targetUrl, { signal });
  } catch {
    return null;
  }
  if (!res.ok) return null;
  const html = await res.text();
  const parsed = parseListingHtmlQuote(html, sym, ex);
  if (!parsed) return null;
  return normalizeFromListingHtmlQuote(parsed);
}
