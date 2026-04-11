import type { AssetKind } from "@/lib/market-data/types";

export type PortfolioPosition = {
  id: string;
  symbol: string;
  quantity: number;
  /** Optional cost basis per unit for realized-style PnL hints */
  avgCostUsd?: number;
  kind: AssetKind;
  /** Full asset name (e.g. company name); ticker stays in `symbol` */
  name?: string;
  /** Listing venue (e.g. TwelveData exchange for equities); optional */
  exchange?: string;
};

export function emptyPortfolio(): PortfolioPosition[] {
  return [];
}
