export type AssetKind = "crypto" | "equity";

export type MarketDataSource =
  | "coingecko"
  | "binance"
  | "twelvedata"
  /** HTML listing page (e.g. BCBA); swappable provider under `src/lib/providers/` */
  | "listing_html";

/** Normalized snapshot used across the app (UI, KPIs, opportunities). */
export type MarketData = {
  symbol: string;
  displayName: string;
  kind: AssetKind;
  price: number;
  currency: string;
  change24hPct: number | null;
  volume24h: number | null;
  high24h: number | null;
  low24h: number | null;
  lastUpdatedMs: number;
  source: MarketDataSource;
  /** Provider-specific id (e.g. CoinGecko coin id) for history endpoints. */
  externalId?: string;
};

export type QuoteKey = `${AssetKind}:${string}`;

/** Keys the quote map; exchange disambiguates BCBA / dual-listing collisions. */
export function positionQuoteKey(p: {
  kind: AssetKind;
  symbol: string;
  exchange?: string;
}): QuoteKey {
  const sym = p.symbol.trim().toUpperCase();
  if (p.kind === "equity") {
    const ex = p.exchange?.trim();
    if (ex) return `equity:${sym}:${ex.toUpperCase()}`;
  }
  return `${p.kind}:${sym}`;
}

export function quoteKey(kind: AssetKind, symbol: string): QuoteKey {
  return positionQuoteKey({ kind, symbol });
}
