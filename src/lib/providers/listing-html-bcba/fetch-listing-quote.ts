import { fetchViaCorsfix } from "@/lib/api/corsfix";
import { normalizeFromListingHtmlQuote } from "@/lib/market-data/normalize";
import type { MarketData } from "@/lib/market-data/types";
import { listingQuotePageUrl } from "./vendor-config";
import { parseListingHtmlQuote } from "./parse-listing-html";

/**
 * BCBA (Buenos Aires) spot quote by scraping the public listing HTML page.
 * Replace `vendor-config` + parsers if this provider stops working.
 */
export async function fetchBcbaListingHtmlQuote(
  symbol: string,
  signal?: AbortSignal,
): Promise<MarketData | null> {
  const sym = symbol.trim().toUpperCase();
  if (!sym) return null;
  const targetUrl = listingQuotePageUrl("BCBA", sym);
  let res: Response;
  try {
    res = await fetchViaCorsfix(targetUrl, { signal });
  } catch {
    return null;
  }
  if (!res.ok) return null;
  const html = await res.text();
  const parsed = parseListingHtmlQuote(html, sym);
  if (!parsed) return null;
  return normalizeFromListingHtmlQuote(parsed);
}
