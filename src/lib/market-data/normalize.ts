import type { AssetKind, MarketData, MarketDataSource } from "./types";

export function buildMarketData(input: {
  symbol: string;
  displayName: string;
  kind: AssetKind;
  price: number;
  currency: string;
  change24hPct: number | null;
  volume24h: number | null;
  high24h: number | null;
  low24h: number | null;
  source: MarketDataSource;
  externalId?: string;
}): MarketData {
  return {
    ...input,
    lastUpdatedMs: Date.now(),
  };
}

/** Binance 24h ticker JSON (subset). */
export type BinanceTicker24h = {
  symbol: string;
  lastPrice: string;
  priceChangePercent: string;
  quoteVolume: string;
  highPrice: string;
  lowPrice: string;
};

export function normalizeFromBinanceTicker(
  ticker: BinanceTicker24h,
  baseSymbol: string,
): MarketData | null {
  const price = Number(ticker.lastPrice);
  if (!Number.isFinite(price)) return null;
  return buildMarketData({
    symbol: baseSymbol.toUpperCase(),
    displayName: baseSymbol.toUpperCase(),
    kind: "crypto",
    price,
    currency: "USD",
    change24hPct: Number(ticker.priceChangePercent),
    volume24h: Number(ticker.quoteVolume),
    high24h: Number(ticker.highPrice),
    low24h: Number(ticker.lowPrice),
    source: "binance",
  });
}

/** CoinGecko /simple/price entry */
export function normalizeFromCoinGeckoSimple(params: {
  coinId: string;
  symbol: string;
  displayName: string;
  usd: number;
  usd24hChange?: number;
}): MarketData {
  return buildMarketData({
    symbol: params.symbol.toUpperCase(),
    displayName: params.displayName,
    kind: "crypto",
    price: params.usd,
    currency: "USD",
    change24hPct:
      params.usd24hChange !== undefined && Number.isFinite(params.usd24hChange)
        ? params.usd24hChange
        : null,
    volume24h: null,
    high24h: null,
    low24h: null,
    source: "coingecko",
    externalId: params.coinId,
  });
}

/** TwelveData /price response */
export function normalizeFromTwelveDataPrice(params: {
  symbol: string;
  price: number;
  currency: string;
}): MarketData {
  return buildMarketData({
    symbol: params.symbol.toUpperCase(),
    displayName: params.symbol.toUpperCase(),
    kind: "equity",
    price: params.price,
    currency: params.currency || "USD",
    change24hPct: null,
    volume24h: null,
    high24h: null,
    low24h: null,
    source: "twelvedata",
  });
}
