import { fetchBinanceUsdTicker } from "@/lib/api/binance";
import { fetchCryptoQuoteViaCoingecko } from "@/lib/api/coingecko";
import { fetchTwelveDataPrice } from "@/lib/api/twelvedata";
import type { AssetKind, MarketData, QuoteKey } from "@/lib/market-data/types";
import { positionQuoteKey } from "@/lib/market-data/types";
import { fetchBcbaListingHtmlQuote } from "@/lib/providers/listing-html-bcba/fetch-listing-quote";
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

async function fetchEquityQuote(
  symbol: string,
  exchange: string | undefined,
  signal?: AbortSignal,
): Promise<MarketData | null> {
  const ex = exchange?.trim().toUpperCase();
  if (ex === "BCBA") {
    const fromListing = await fetchBcbaListingHtmlQuote(symbol, signal);
    if (fromListing) return fromListing;
  }
  return fetchTwelveDataPrice(symbol, signal, exchange);
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

  const settled = await Promise.allSettled(
    [...uniq.values()].map(async (p) => {
      const k = positionQuoteKey(p);
      try {
        const data =
          p.kind === "equity"
            ? await fetchEquityQuote(p.symbol, p.exchange, signal)
            : await fetchCryptoQuote(p.symbol, signal);
        return { k, data } as const;
      } catch {
        return { k, data: null } as const;
      }
    }),
  );

  const out: Record<QuoteKey, MarketData> = {};
  for (const r of settled) {
    if (r.status !== "fulfilled") continue;
    const { k, data } = r.value;
    if (data) out[k] = data;
  }
  return out;
}
