"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchQuotesForPortfolio } from "@/lib/quotes/fetch-portfolio-quotes";
import type { PortfolioPosition } from "@/lib/portfolio/types";
import { queryKeys } from "./keys";

const STALE_MS = 45_000;

export function usePortfolioQuotes(positions: PortfolioPosition[]) {
  return useQuery({
    queryKey: queryKeys.portfolioQuotes(positions),
    queryFn: ({ signal }) => fetchQuotesForPortfolio(positions, signal),
    enabled: positions.length > 0,
    staleTime: STALE_MS,
    refetchInterval: false,
  });
}
