"use client";

import type { PortfolioKpis } from "@/lib/calculations/portfolio-kpis";
import {
  loadNetWorthHistory,
  mergeNetWorthDailySample,
  saveNetWorthHistory,
  type NetWorthHistoryPoint,
} from "@/lib/storage/market-cache-db";
import { useEffect, useRef, useState } from "react";

const MAX_POINTS = 730;
const DEBOUNCE_MS = 4000;

/**
 * Loads observed net-worth samples from IndexedDB and appends the current KPI
 * total when quotes succeed and the book is not mixed-currency. Persists with
 * debounce; uses the same inputs as KPIs (no extra market API calls).
 */
export function useNetWorthHistoryObserved(
  kpis: PortfolioKpis,
  portfolioLength: number,
  quotesQuerySuccess: boolean,
): NetWorthHistoryPoint[] {
  const [points, setPoints] = useState<NetWorthHistoryPoint[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestSnapRef = useRef<NetWorthHistoryPoint | null>(null);

  useEffect(() => {
    let cancelled = false;
    void loadNetWorthHistory().then((loaded) => {
      if (!cancelled) setPoints(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (portfolioLength === 0 || !quotesQuerySuccess || kpis.hasMixedCurrencies) {
      return;
    }
    if (!Number.isFinite(kpis.totalValue)) return;

    const snap: NetWorthHistoryPoint = {
      t: Date.now(),
      value: kpis.totalValue,
      currency: kpis.displayCurrency.trim().toUpperCase() || "USD",
    };
    latestSnapRef.current = snap;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    let alive = true;
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      const s = latestSnapRef.current;
      if (!s) return;
      void (async () => {
        const base = await loadNetWorthHistory();
        if (!alive) return;
        const merged = mergeNetWorthDailySample(base, s, {
          maxPoints: MAX_POINTS,
        });
        await saveNetWorthHistory(merged);
        if (!alive) return;
        setPoints(merged);
      })();
    }, DEBOUNCE_MS);

    return () => {
      alive = false;
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, [
    portfolioLength,
    quotesQuerySuccess,
    kpis.hasMixedCurrencies,
    kpis.totalValue,
    kpis.displayCurrency,
  ]);

  return points;
}
