import { fetchBinanceUsdTicker } from "@/lib/api/binance";
import { fetchCryptoQuoteViaCoingecko } from "@/lib/api/coingecko";
import { fetchTwelveDataPrice } from "@/lib/api/twelvedata";
import type { AssetKind, MarketData, QuoteKey } from "@/lib/market-data/types";
import { positionQuoteKey } from "@/lib/market-data/types";
import type { PortfolioPosition } from "@/lib/portfolio/types";

async function fetchCryptoQuote(
  symbol: string,
  signal?: AbortSignal,
): Promise<MarketData | null> {
  try {
    const fromBinance = await fetchBinanceUsdTicker(symbol, signal);
    if (fromBinance) return fromBinance;
  } catch {
    /* Binance often blocks browser CORS; CoinGecko is the reliable path */
  }
  return fetchCryptoQuoteViaCoingecko(symbol, signal);
}

export async function fetchQuotesForPortfolio(
  positions: PortfolioPosition[],
  signal?: AbortSignal,
): Promise<Record<QuoteKey, MarketData>> {
  const uniq = new Map<
    QuoteKey,
    { symbol: string; kind: AssetKind; exchange?: string }
  >();
  for (const p of positions) {
    const k = positionQuoteKey(p);
    if (!uniq.has(k))
      uniq.set(k, {
        symbol: p.symbol,
        kind: p.kind,
        exchange: p.exchange,
      });
  }

  const results = await Promise.all(
    [...uniq.values()].map(async (p) => {
      const k = positionQuoteKey(p);
      const data =
        p.kind === "equity"
          ? await fetchTwelveDataPrice(p.symbol, signal, p.exchange)
          : await fetchCryptoQuote(p.symbol, signal);
      return { k, data } as const;
    }),
  );

  const out: Record<QuoteKey, MarketData> = {};
  for (const { k, data } of results) {
    if (data) out[k] = data;
  }
  return out;
}
