/**
 * Replace this module if the listing site or URL pattern changes.
 * Keep broker-specific hostnames and paths out of the rest of the app.
 */
const LISTING_SITE_ORIGIN = "https://iol.invertironline.com";

/** Path pattern: /titulo/cotizacion/{exchange}/{symbol} */
export function listingQuotePageUrl(exchange: string, symbol: string): string {
  const ex = exchange.trim().toUpperCase();
  const sym = symbol.trim().toUpperCase();
  return `${LISTING_SITE_ORIGIN}/titulo/cotizacion/${encodeURIComponent(ex)}/${encodeURIComponent(sym)}`;
}
