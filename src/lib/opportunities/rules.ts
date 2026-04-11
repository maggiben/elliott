import { positionQuoteKey } from "@/lib/market-data/types";
import type { MarketData } from "@/lib/market-data/types";
import type { PortfolioKpis } from "@/lib/calculations/portfolio-kpis";
import type { PortfolioPosition } from "@/lib/portfolio/types";

export type Opportunity = {
  id: string;
  severity: "info" | "warn";
  title: string;
  detail: string;
  symbol?: string;
};

const CONCENTRATION = 0.4;
const DROP_24H = -10;
const RALLY_24H = 15;

export function detectOpportunities(
  kpis: PortfolioKpis,
  positions: PortfolioPosition[],
  quotes: Record<string, MarketData | undefined>,
): Opportunity[] {
  const out: Opportunity[] = [];

  for (const slice of kpis.allocation) {
    if (slice.weight >= CONCENTRATION) {
      out.push({
        id: `conc-${slice.id}`,
        severity: "warn",
        title: "Concentration risk",
        detail: `${slice.symbol} (${slice.kind}) is ${(slice.weight * 100).toFixed(1)}% of the book.`,
        symbol: slice.symbol,
      });
    }
  }

  for (const p of positions) {
    const q = quotes[positionQuoteKey(p)];
    const ch = q?.change24hPct;
    if (ch === null || ch === undefined || !Number.isFinite(ch)) continue;
    const sym = p.symbol.toUpperCase();
    if (ch <= DROP_24H) {
      out.push({
        id: `drop-${p.id}`,
        severity: "warn",
        title: "Large 24h drawdown",
        detail: `${sym} is down ${ch.toFixed(1)}% vs. yesterday.`,
        symbol: sym,
      });
    } else if (ch >= RALLY_24H) {
      out.push({
        id: `momo-${p.id}`,
        severity: "info",
        title: "Strong 24h move",
        detail: `${sym} is up ${ch.toFixed(1)}% vs. yesterday — review sizing.`,
        symbol: sym,
      });
    }
  }

  if (kpis.pnlPct !== null && kpis.pnlPct <= -0.2) {
    out.push({
      id: "portfolio-down-cost",
      severity: "warn",
      title: "Portfolio vs. cost basis",
      detail: `Aggregate PnL is ${(kpis.pnlPct * 100).toFixed(1)}% relative to recorded cost.`,
    });
  }

  return out;
}
