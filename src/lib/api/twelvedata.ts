import {
  fetchMarketTwelveDataPrice,
  fetchMarketTwelveDataSymbolSearch,
  fetchMarketTwelveDataTimeSeries,
} from "@/lib/api/market-api-client";
import type { MarketData } from "@/lib/market-data/types";

export type TwelveDataSymbolHit = {
  symbol: string;
  instrumentName: string;
  exchange: string;
};

export async function fetchTwelveDataPrice(
  symbol: string,
  signal?: AbortSignal,
  exchange?: string,
): Promise<MarketData | null> {
  const body = await fetchMarketTwelveDataPrice(symbol, exchange, signal);
  return body?.data ?? null;
}

export async function twelveDataSymbolSearch(
  query: string,
  signal?: AbortSignal,
): Promise<TwelveDataSymbolHit[]> {
  const body = await fetchMarketTwelveDataSymbolSearch(query, signal);
  return body?.hits ?? [];
}

export async function fetchTwelveDataTimeSeries(
  symbol: string,
  outputsize: number,
  signal?: AbortSignal,
  exchange?: string,
): Promise<{ timeSec: number; value: number }[]> {
  const body = await fetchMarketTwelveDataTimeSeries(
    symbol,
    outputsize,
    exchange,
    signal,
  );
  return body?.points ?? [];
}
