"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import type { MarketData, QuoteKey } from "@/lib/market-data/types";
import {
  loadQuotesCache,
  quotesSubsetForPositions,
  saveQuotesCacheMerge,
} from "@/lib/storage/market-cache-db";
import { debounce } from "@/lib/utils/debounce";
import { fetchQuotesForPortfolio } from "@/lib/quotes/fetch-portfolio-quotes";
import type { PortfolioPosition } from "@/lib/portfolio/types";
import { queryKeys } from "./keys";

const STALE_MS = 45_000;
/** Keep quote rows in memory long enough to survive tab backgrounding / brief offline use. */
const GC_MS = 1000 * 60 * 60 * 24 * 7;

export function usePortfolioQuotes(positions: PortfolioPosition[]) {
  const queryClient = useQueryClient();
  const queryKey = queryKeys.portfolioQuotes(positions);

  const persistQuotes = useMemo(
    () =>
      debounce((slice: Record<QuoteKey, MarketData>) => {
        void saveQuotesCacheMerge(slice);
      }, 600),
    [],
  );

  return useQuery({
    queryKey,
    queryFn: async ({ signal }) => {
      const [idbFull, fresh] = await Promise.all([
        loadQuotesCache(),
        fetchQuotesForPortfolio(positions, signal),
      ]);
      const idbSubset = quotesSubsetForPositions(idbFull, positions);
      const prev =
        (queryClient.getQueryData(queryKey) as
          | Record<QuoteKey, MarketData>
          | undefined) ?? {};
      const merged: Record<QuoteKey, MarketData> = {
        ...idbSubset,
        ...prev,
        ...fresh,
      };
      if (Object.keys(fresh).length > 0) persistQuotes(merged);
      return merged;
    },
    enabled: positions.length > 0,
    staleTime: STALE_MS,
    gcTime: GC_MS,
    refetchInterval: false,
    /** Refetch failed queries when the tab goes online again. */
    refetchOnReconnect: true,
  });
}
