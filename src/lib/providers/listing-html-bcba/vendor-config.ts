/**
 * Replace this module if the listing site or URL pattern changes.
 * Keep broker-specific hostnames and paths out of the rest of the app.
 */
export const IOL_SITE_ORIGIN = "https://iol.invertironline.com";

/**
 * Default venues when `NEXT_PUBLIC_IOL_LISTING_EXCHANGES` is unset (comma-separated MIC-style codes).
 * Override the env to add XETRA, etc., or trim to a subset.
 */
export const DEFAULT_IOL_LISTING_EXCHANGES_CSV =
  "BCBA,NYSE,NASDAQ,AMEX,ARCA,BATS";

/** Parsed set; empty env string means “no IOL-first venues”. */
export function iolListingPreferredExchanges(): Set<string> {
  const raw = process.env.NEXT_PUBLIC_IOL_LISTING_EXCHANGES;
  const csv =
    raw === undefined || raw === null
      ? DEFAULT_IOL_LISTING_EXCHANGES_CSV
      : raw.trim();
  if (csv === "") return new Set<string>();
  const set = new Set<string>();
  for (const part of csv.split(",")) {
    const ex = part.trim().toUpperCase();
    if (ex) set.add(ex);
  }
  return set;
}

/**
 * Listing HTML + UDF history on IOL share the same layout for configured venues.
 * Prefer IOL before TwelveData to avoid API credits where the feed exists.
 */
export function isIolListingPreferredExchange(
  exchange: string | undefined,
): boolean {
  const ex = exchange?.trim().toUpperCase();
  if (!ex) return false;
  return iolListingPreferredExchanges().has(ex);
}

/** TradingView UDF-style feed used by IOL's graficador (`init.controllerURL` in their HTML). */
const IOL_UDF_PATH = "/api/cotizaciones";

/** Path pattern: /titulo/cotizacion/{exchange}/{symbol} */
export function listingQuotePageUrl(exchange: string, symbol: string): string {
  const ex = exchange.trim().toUpperCase();
  const sym = symbol.trim().toUpperCase();
  return `${IOL_SITE_ORIGIN}/titulo/cotizacion/${encodeURIComponent(ex)}/${encodeURIComponent(sym)}`;
}

/** GET history URL (UDF); resolution `D` = daily bars. Times are Unix seconds. */
export function iolUdfHistoryUrl(
  symbol: string,
  exchange: string,
  fromSec: number,
  toSec: number,
  resolution: string = "D",
): string {
  const sym = symbol.trim().toUpperCase();
  const ex = exchange.trim().toUpperCase();
  const q = new URLSearchParams({
    symbolName: sym,
    exchange: ex,
    from: String(Math.floor(fromSec)),
    to: String(Math.floor(toSec)),
    resolution,
  });
  return `${IOL_SITE_ORIGIN}${IOL_UDF_PATH}/history?${q.toString()}`;
}
