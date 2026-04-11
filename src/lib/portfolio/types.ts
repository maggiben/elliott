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
  /**
   * Term deposit / plazo fijo (`kind: "fixed_income"`): principal in `quantity`,
   * nominal annual rate (TNA) in percent, ISO `YYYY-MM-DD` dates, position currency.
   */
  fixedIncomeAnnualRatePct?: number;
  fixedIncomeStartDate?: string;
  fixedIncomeMaturityDate?: string;
  fixedIncomeCurrency?: string;
};

export function emptyPortfolio(): PortfolioPosition[] {
  return [];
}
