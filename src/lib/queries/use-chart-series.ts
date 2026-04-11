"use client";

import { useQuery } from "@tanstack/react-query";
import { coingeckoMarketChartUsd, coingeckoSearchTopCoin } from "@/lib/api/coingecko";
import { fetchTwelveDataTimeSeries } from "@/lib/api/twelvedata";
import { queryKeys } from "./keys";

export function useCryptoChartSeries(symbol: string | null, days: number) {
  return useQuery({
    queryKey: queryKeys.chartCrypto(symbol ?? "_", days),
    enabled: Boolean(symbol),
    staleTime: 5 * 60_000,
    queryFn: async ({ signal }) => {
      if (!symbol) return [];
      const coin = await coingeckoSearchTopCoin(symbol, signal);
      if (!coin) return [];
      return coingeckoMarketChartUsd(coin.id, days, signal);
    },
  });
}

export function useEquityChartSeries(
  symbol: string | null,
  days: number,
  exchange?: string | null,
) {
  const ex = exchange?.trim() || undefined;
  return useQuery({
    queryKey: queryKeys.chartEquity(symbol ?? "_", days, ex),
    enabled: Boolean(symbol),
    staleTime: 5 * 60_000,
    queryFn: async ({ signal }) => {
      if (!symbol) return [];
      return fetchTwelveDataTimeSeries(symbol, days, signal, ex);
    },
  });
}
