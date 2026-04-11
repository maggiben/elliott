import { fixedIncomeAccruedMultiplier } from "@/lib/calculations/fixed-income-accrual";
import { buildMarketData } from "@/lib/market-data/normalize";
import type { MarketData } from "@/lib/market-data/types";
import type { PortfolioPosition } from "@/lib/portfolio/types";

export function buildFixedIncomeQuote(
  p: PortfolioPosition,
): MarketData | null {
  if (p.kind !== "fixed_income") return null;
  const rate = p.fixedIncomeAnnualRatePct;
  const start = p.fixedIncomeStartDate?.trim();
  const maturity = p.fixedIncomeMaturityDate?.trim();
  const currency = (p.fixedIncomeCurrency ?? "ARS").trim().toUpperCase() || "ARS";
  if (
    rate === undefined ||
    !Number.isFinite(rate) ||
    rate < 0 ||
    !start ||
    !maturity
  ) {
    return null;
  }

  const mult = fixedIncomeAccruedMultiplier({
    annualRatePct: rate,
    startDate: start,
    maturityDate: maturity,
  });
  if (mult === null) return null;

  const sym = p.symbol.trim().toUpperCase();
  const label =
    p.name?.trim() || `Plazo fijo (${sym})`;

  return buildMarketData({
    symbol: sym,
    displayName: label,
    kind: "fixed_income",
    price: mult,
    currency,
    change24hPct: null,
    volume24h: null,
    high24h: null,
    low24h: null,
    source: "fixed_income_synthetic",
  });
}
