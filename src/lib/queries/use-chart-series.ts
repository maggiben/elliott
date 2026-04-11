"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { coingeckoMarketChartUsd, coingeckoSearchTopCoin } from "@/lib/api/coingecko";
import { fetchTwelveDataTimeSeries } from "@/lib/api/twelvedata";
import { fetchBcbaIolUdfDailySeries } from "@/lib/providers/listing-html-bcba/fetch-iol-udf-daily-series";
import type { ChartPoint } from "@/lib/storage/market-cache-db";
import {
  chartCacheKeyCrypto,
  chartCacheKeyEquity,
  loadChartSeriesForKey,
  saveChartSeriesForKey,
} from "@/lib/storage/market-cache-db";
import { queryKeys } from "./keys";

const STALE_MS = 5 * 60_000;
const GC_MS = 1000 * 60 * 60 * 24 * 7;

function mergeChartSeries(
  fresh: ChartPoint[],
  prev: ChartPoint[] | undefined,
  idb: ChartPoint[],
): ChartPoint[] {
  if (fresh.length > 0) return fresh;
  if (prev && prev.length > 0) return prev;
  return idb;
}

export function useCryptoChartSeries(symbol: string | null, days: number) {
  const queryClient = useQueryClient();
  const sym = symbol?.trim() ?? "";
  const queryKey = queryKeys.chartCrypto(sym || "_", days);

  return useQuery({
    queryKey,
    enabled: Boolean(sym),
    staleTime: STALE_MS,
    gcTime: GC_MS,
    refetchOnReconnect: true,
    queryFn: async ({ signal }) => {
      if (!sym) return [];
      const cacheKey = chartCacheKeyCrypto(sym, days);
      const idbSeries = await loadChartSeriesForKey(cacheKey);
      const prev = queryClient.getQueryData(queryKey) as
        | ChartPoint[]
        | undefined;
      if (idbSeries.length > 0) {
        queryClient.setQueryData(
          queryKey,
          mergeChartSeries([], prev, idbSeries),
        );
      }

      let fresh: ChartPoint[] = [];
      try {
        const coin = await coingeckoSearchTopCoin(sym, signal);
        if (coin) {
          fresh = await coingeckoMarketChartUsd(coin.id, days, signal);
        }
      } catch {
        fresh = [];
      }

      const merged = mergeChartSeries(
        fresh,
        queryClient.getQueryData(queryKey) as ChartPoint[] | undefined,
        idbSeries,
      );
      if (fresh.length > 0) void saveChartSeriesForKey(cacheKey, fresh);
      return merged;
    },
  });
}

export function useEquityChartSeries(
  symbol: string | null,
  days: number,
  exchange?: string | null,
) {
  const queryClient = useQueryClient();
  const sym = symbol?.trim() ?? "";
  const ex = exchange?.trim() || undefined;
  const queryKey = queryKeys.chartEquity(sym || "_", days, ex);

  return useQuery({
    queryKey,
    enabled: Boolean(sym),
    staleTime: STALE_MS,
    gcTime: GC_MS,
    refetchOnReconnect: true,
    queryFn: async ({ signal }) => {
      if (!sym) return [];
      const cacheKey = chartCacheKeyEquity(sym, days, ex);
      const idbSeries = await loadChartSeriesForKey(cacheKey);
      const prev = queryClient.getQueryData(queryKey) as
        | ChartPoint[]
        | undefined;
      if (idbSeries.length > 0) {
        queryClient.setQueryData(
          queryKey,
          mergeChartSeries([], prev, idbSeries),
        );
      }

      let fresh: ChartPoint[] = [];
      try {
        if (ex?.toUpperCase() === "BCBA") {
          fresh = await fetchBcbaIolUdfDailySeries(sym, days, signal);
        }
        if (fresh.length === 0) {
          fresh = await fetchTwelveDataTimeSeries(sym, days, signal, ex);
        }
      } catch {
        fresh = [];
      }

      const merged = mergeChartSeries(
        fresh,
        queryClient.getQueryData(queryKey) as ChartPoint[] | undefined,
        idbSeries,
      );
      if (fresh.length > 0) void saveChartSeriesForKey(cacheKey, fresh);
      return merged;
    },
  });
}
