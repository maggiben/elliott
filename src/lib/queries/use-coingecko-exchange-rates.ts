"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { fetchCoingeckoExchangeRates } from "@/lib/api/coingecko-exchange-rates";
import {
  loadExchangeRatesCache,
  saveExchangeRatesCacheMerge,
} from "@/lib/storage/market-cache-db";
import {
  getExchangeRatesFetchedAt,
  isWithinMarketFetchTtl,
  MARKET_FETCH_TTL_MS,
  touchExchangeRatesFetchedAt,
} from "@/lib/storage/market-fetch-ttl";
import { debounce } from "@/lib/utils/debounce";
import { queryKeys } from "./keys";

const STALE_MS = MARKET_FETCH_TTL_MS;
const GC_MS = 1000 * 60 * 60 * 24 * 7;

export function useCoingeckoExchangeRates(enabled: boolean) {
  const queryClient = useQueryClient();
  const queryKey = queryKeys.coingeckoExchangeRates;

  const persistRates = useMemo(
    () =>
      debounce((rates: Record<string, number>) => {
        void saveExchangeRatesCacheMerge(rates);
      }, 600),
    [],
  );

  return useQuery({
    queryKey,
    queryFn: async ({ signal }) => {
      const [cachedIdb, ratesFetchedAt] = await Promise.all([
        loadExchangeRatesCache(),
        getExchangeRatesFetchedAt(),
      ]);
      const prev =
        (queryClient.getQueryData(queryKey) as
          | Record<string, number>
          | undefined) ?? {};

      if (
        isWithinMarketFetchTtl(ratesFetchedAt) &&
        Object.keys(cachedIdb).length > 0
      ) {
        return { ...cachedIdb, ...prev };
      }

      let fresh: Record<string, number> = {};
      try {
        fresh = await fetchCoingeckoExchangeRates(signal);
      } catch {
        /* rate limits / offline — keep cached */
      }
      const merged: Record<string, number> = {
        ...cachedIdb,
        ...prev,
        ...fresh,
      };
      if (Object.keys(fresh).length > 0) {
        persistRates(merged);
        void touchExchangeRatesFetchedAt();
      }
      return merged;
    },
    staleTime: STALE_MS,
    gcTime: GC_MS,
    enabled,
    refetchOnReconnect: true,
  });
}
