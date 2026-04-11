import { positionQuoteKey } from "@/lib/market-data/types";
import type { MarketData } from "@/lib/market-data/types";
import type { PortfolioPosition } from "@/lib/portfolio/types";

export type AllocationSlice = {
  id: string;
  symbol: string;
  kind: PortfolioPosition["kind"];
  valueUsd: number;
  weight: number;
  exchange?: string;
  /** Quote currency from the live quote (often USD). */
  currency: string;
};

export type PortfolioKpis = {
  totalValueUsd: number;
  totalCostUsd: number | null;
  pnlUsd: number | null;
  pnlPct: number | null;
  dayChangeUsd: number | null;
  dayChangePct: number | null;
  allocation: AllocationSlice[];
  /** True when quotes use more than one currency; book-level USD totals are not meaningful. */
  hasMixedCurrencies: boolean;
};

function positionValueUsd(
  p: PortfolioPosition,
  quotes: Record<string, MarketData | undefined>,
): number | null {
  const q = quotes[positionQuoteKey(p)];
  if (!q || !Number.isFinite(q.price)) return null;
  return p.quantity * q.price;
}

export function computePortfolioKpis(
  positions: PortfolioPosition[],
  quotes: Record<string, MarketData | undefined>,
): PortfolioKpis {
  let totalValueUsd = 0;
  let totalCostUsd = 0;
  let hasCost = false;
  let dayNum = 0;
  let dayDen = 0;

  const allocation: AllocationSlice[] = [];
  const currencies = new Set<string>();

  for (const p of positions) {
    const q = quotes[positionQuoteKey(p)];
    const v = positionValueUsd(p, quotes);
    if (v === null) continue;
    const cur = (q?.currency ?? "USD").toUpperCase();
    currencies.add(cur);
    totalValueUsd += v;
    allocation.push({
      id: p.id,
      symbol: p.symbol.toUpperCase(),
      kind: p.kind,
      valueUsd: v,
      weight: 0,
      currency: cur,
      ...(p.exchange?.trim() ? { exchange: p.exchange.trim() } : {}),
    });

    if (p.avgCostUsd !== undefined && Number.isFinite(p.avgCostUsd)) {
      hasCost = true;
      totalCostUsd += p.quantity * p.avgCostUsd;
    }

    const ch = q?.change24hPct;
    if (q && ch != null && Number.isFinite(ch)) {
      dayNum += v * (ch / 100);
      dayDen += v;
    }
  }

  const hasMixedCurrencies = currencies.size > 1;

  for (const slice of allocation) {
    slice.weight =
      !hasMixedCurrencies && totalValueUsd > 0
        ? slice.valueUsd / totalValueUsd
        : 0;
  }

  allocation.sort((a, b) => b.valueUsd - a.valueUsd);

  const pnlUsd =
    hasCost && !hasMixedCurrencies ? totalValueUsd - totalCostUsd : null;
  const pnlPct =
    hasCost &&
    !hasMixedCurrencies &&
    totalCostUsd > 0 &&
    pnlUsd !== null
      ? pnlUsd / totalCostUsd
      : null;

  const dayChangePct =
    !hasMixedCurrencies && dayDen > 0 ? dayNum / dayDen : null;
  const dayChangeUsd =
    !hasMixedCurrencies &&
    dayChangePct !== null &&
    Number.isFinite(dayChangePct)
      ? totalValueUsd - totalValueUsd / (1 + dayChangePct)
      : null;

  return {
    totalValueUsd,
    totalCostUsd: hasCost ? totalCostUsd : null,
    pnlUsd,
    pnlPct,
    dayChangeUsd,
    dayChangePct,
    allocation,
    hasMixedCurrencies,
  };
}
