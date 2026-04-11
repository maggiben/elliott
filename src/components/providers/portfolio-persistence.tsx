"use client";

import { useAtom } from "jotai";
import { useEffect, useMemo } from "react";
import { debounce } from "@/lib/utils/debounce";
import { loadPortfolioFromIdb, savePortfolioToIdb } from "@/lib/storage/portfolio-db";
import {
  portfolioAtom,
  portfolioHydratedAtom,
} from "@/state/portfolio-atoms";
import type { PortfolioPosition } from "@/lib/portfolio/types";

export function PortfolioPersistence({ children }: { children: React.ReactNode }) {
  const [portfolio, setPortfolio] = useAtom(portfolioAtom);
  const [hydrated, setHydrated] = useAtom(portfolioHydratedAtom);

  useEffect(() => {
    let cancelled = false;
    loadPortfolioFromIdb()
      .then((rows) => {
        if (!cancelled) setPortfolio(rows);
      })
      .finally(() => {
        if (!cancelled) setHydrated(true);
      });
    return () => {
      cancelled = true;
    };
  }, [setPortfolio, setHydrated]);

  const saveDebounced = useMemo(
    () =>
      debounce((rows: PortfolioPosition[]) => {
        void savePortfolioToIdb(rows);
      }, 400),
    [],
  );

  useEffect(() => {
    if (!hydrated) return;
    saveDebounced(portfolio);
  }, [portfolio, saveDebounced, hydrated]);

  return children;
}
