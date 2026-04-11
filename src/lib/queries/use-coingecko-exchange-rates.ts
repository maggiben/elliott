"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchCoingeckoExchangeRates } from "@/lib/api/coingecko-exchange-rates";
import { queryKeys } from "./keys";

const STALE_MS = 120_000;

export function useCoingeckoExchangeRates(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.coingeckoExchangeRates,
    queryFn: ({ signal }) => fetchCoingeckoExchangeRates(signal),
    staleTime: STALE_MS,
    enabled,
  });
}
