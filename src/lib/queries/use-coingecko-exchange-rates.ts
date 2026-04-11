"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { fetchCoingeckoExchangeRates } from "@/lib/api/coingecko-exchange-rates";
import {
  loadExchangeRatesCache,
  saveExchangeRatesCacheMerge,
} from "@/lib/storage/market-cache-db";
import { debounce } from "@/lib/utils/debounce";
import { queryKeys } from "./keys";

const STALE_MS = 120_000;
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
      const cachedIdb = await loadExchangeRatesCache();
      const prev =
        (queryClient.getQueryData(queryKey) as
          | Record<string, number>
          | undefined) ?? {};
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
      if (Object.keys(fresh).length > 0) persistRates(merged);
      return merged;
    },
    staleTime: STALE_MS,
    gcTime: GC_MS,
    enabled,
    refetchOnReconnect: true,
  });
}
