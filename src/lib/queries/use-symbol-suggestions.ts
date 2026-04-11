"use client";

import { useQuery } from "@tanstack/react-query";
import { coingeckoSearchCoins } from "@/lib/api/coingecko";
import { twelveDataSymbolSearch } from "@/lib/api/twelvedata";
import type { AssetKind } from "@/lib/market-data/types";
import { queryKeys } from "./keys";

export function useSymbolSuggestions(kind: AssetKind, debouncedQuery: string) {
  const q = debouncedQuery.trim();
  const enabledCrypto =
    kind === "crypto" && q.length >= 1;
  const enabledEquity =
    kind === "equity" && q.length >= 1;

  const cryptoQ = useQuery({
    queryKey: queryKeys.symbolSuggestCrypto(q),
    queryFn: ({ signal }) => coingeckoSearchCoins(q, { limit: 12, signal }),
    enabled: enabledCrypto,
    staleTime: 60_000,
  });

  const equityQ = useQuery({
    queryKey: queryKeys.symbolSuggestEquity(q),
    queryFn: ({ signal }) => twelveDataSymbolSearch(q, signal),
    enabled: enabledEquity,
    staleTime: 60_000,
  });

  if (kind === "fixed_income") {
    return { options: [], isLoading: false, isError: false } as const;
  }

  if (kind === "crypto") {
    return {
      options: cryptoQ.data ?? [],
      isLoading: cryptoQ.isFetching,
      isError: cryptoQ.isError,
    } as const;
  }
  return {
    options: equityQ.data ?? [],
    isLoading: equityQ.isFetching,
    isError: equityQ.isError,
  } as const;
}
