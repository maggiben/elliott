import type { AssetKind } from "@/lib/market-data/types";
import { positionQuoteKey } from "@/lib/market-data/types";
import type { PortfolioPosition } from "@/lib/portfolio/types";

export const queryKeys = {
  portfolioQuotes: (positions: PortfolioPosition[]) =>
    [
      "portfolio-quotes",
      [...positions]
        .map((p) => {
          const base = `${positionQuoteKey(p)}:${p.quantity}:${p.avgCostUsd ?? ""}`;
          if (p.kind === "fixed_income") {
            return `${base}:${p.fixedIncomeAnnualRatePct ?? ""}:${p.fixedIncomeStartDate ?? ""}:${p.fixedIncomeMaturityDate ?? ""}:${p.fixedIncomeCurrency ?? ""}`;
          }
          return base;
        })
        .sort(),
    ] as const,

  chartCrypto: (coinId: string, days: number) =>
    ["chart", "crypto", coinId, days] as const,

  chartEquity: (symbol: string, days: number, exchange?: string) =>
    [
      "chart",
      "equity",
      symbol.toUpperCase(),
      (exchange?.trim().toUpperCase() ?? "") || "_",
      days,
    ] as const,

  coingeckoId: (symbol: string, kind: AssetKind) =>
    ["coingecko-id", kind, symbol.toUpperCase()] as const,

  symbolSuggestCrypto: (q: string) =>
    ["symbol-suggest", "crypto", q.toLowerCase()] as const,

  symbolSuggestEquity: (q: string) =>
    ["symbol-suggest", "equity", q.toLowerCase()] as const,

  coingeckoExchangeRates: ["coingecko", "exchange_rates"] as const,
} as const;

export function positionQuoteQueryTag(p: PortfolioPosition) {
  return positionQuoteKey(p);
}
