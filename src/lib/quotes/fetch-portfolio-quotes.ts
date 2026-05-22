import { fetchBinanceUsdTicker } from "@/lib/api/binance";
import { fetchCryptoQuoteViaCoingecko } from "@/lib/api/coingecko";
import { fetchTwelveDataPrice } from "@/lib/api/twelvedata";
import type { MarketData, QuoteKey } from "@/lib/market-data/types";
import { positionQuoteKey } from "@/lib/market-data/types";
import { fetchIolListingHtmlQuote } from "@/lib/providers/listing-html-bcba/fetch-listing-quote";
import type { PortfolioPosition } from "@/lib/portfolio/types";
import { buildFixedIncomeQuote } from "./build-fixed-income-quote";

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
  if (ex) {
    const fromListing = await fetchIolListingHtmlQuote(symbol, ex, signal);
    if (fromListing) return fromListing;
  }
  return fetchTwelveDataPrice(symbol, signal, exchange);
}

/** Merges quote layers and always rebuilds synthetic fixed-income rows from positions. */
export function mergePortfolioQuoteLayers(
  positions: PortfolioPosition[],
  ...layers: Record<QuoteKey, MarketData>[]
): Record<QuoteKey, MarketData> {
  const merged: Record<QuoteKey, MarketData> = Object.assign({}, ...layers);
  for (const p of positions) {
    if (p.kind !== "fixed_income") continue;
    const q = buildFixedIncomeQuote(p);
    if (q) merged[positionQuoteKey(p)] = q;
  }
  return merged;
}

export async function fetchQuotesForPortfolio(
  positions: PortfolioPosition[],
  signal?: AbortSignal,
): Promise<Record<QuoteKey, MarketData>> {
  const uniq = new Map<QuoteKey, PortfolioPosition>();
  for (const p of positions) {
    const k = positionQuoteKey(p);
    if (!uniq.has(k)) uniq.set(k, p);
  }

  const settled = await Promise.allSettled(
    [...uniq.entries()].map(async ([k, p]) => {
      try {
        if (p.kind === "fixed_income") {
          return { k, data: buildFixedIncomeQuote(p) } as const;
        }
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
