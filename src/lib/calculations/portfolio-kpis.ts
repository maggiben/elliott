import {
  convertAmountViaBtcBridge,
  portfolioNeedsFxUnification,
} from "@/lib/calculations/fx-via-btc";
import { positionQuoteKey } from "@/lib/market-data/types";
import type { MarketData } from "@/lib/market-data/types";
import type { PortfolioPosition } from "@/lib/portfolio/types";

export type AllocationSlice = {
  id: string;
  symbol: string;
  kind: PortfolioPosition["kind"];
  /** Holding value in `currency` (display currency when the book is unified). */
  value: number;
  weight: number;
  exchange?: string;
  /** ISO-style code for formatting (display currency when unified). */
  currency: string;
};

export type PortfolioKpis = {
  displayCurrency: string;
  totalValue: number;
  /** Cost basis in `displayCurrency` when PnL is meaningful; otherwise null. */
  totalCost: number | null;
  pnl: number | null;
  pnlPct: number | null;
  dayChange: number | null;
  dayChangePct: number | null;
  allocation: AllocationSlice[];
  /**
   * True when quote currencies disagree (or FX is required but missing/failed)
   * so totals and weights must not mix incompatible units.
   */
  hasMixedCurrencies: boolean;
};

export type ComputePortfolioKpisOptions = {
  displayCurrency?: string;
  /**
   * CoinGecko `/exchange_rates` map (lowercase keys). Omit or leave unset while
   * rates are still loading when FX unification is required.
   * A canonical `btc` leg (1 unit of BTC per 1 BTC) is applied when missing so
   * BTC book currency can convert via the same bridge as fiat.
   */
  btcDenominatedRates?: Record<string, number>;
};

function exchangeRatesWithCanonicalBtc(
  rates: Record<string, number>,
): Record<string, number> {
  const b = rates.btc;
  if (typeof b === "number" && Number.isFinite(b) && b > 0) return rates;
  return { ...rates, btc: 1 };
}

function positionRawValue(
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
  options?: ComputePortfolioKpisOptions,
): PortfolioKpis {
  const displayCurrency =
    (options?.displayCurrency ?? "USD").trim().toUpperCase() || "USD";
  const ratesRaw = options?.btcDenominatedRates;
  const rates =
    ratesRaw && Object.keys(ratesRaw).length > 0
      ? exchangeRatesWithCanonicalBtc(ratesRaw)
      : undefined;

  let totalCostUsdBasis = 0;
  let hasCost = false;
  for (const p of positions) {
    if (p.avgCostUsd !== undefined && Number.isFinite(p.avgCostUsd)) {
      hasCost = true;
      totalCostUsdBasis += p.quantity * p.avgCostUsd;
    }
  }

  type Row = {
    position: PortfolioPosition;
    rawValue: number;
    quoteCur: string;
    ch: number | null;
  };

  const rows: Row[] = [];
  for (const p of positions) {
    const q = quotes[positionQuoteKey(p)];
    const raw = positionRawValue(p, quotes);
    if (raw === null) continue;
    const quoteCur = (q?.currency ?? "USD").toUpperCase();
    rows.push({
      position: p,
      rawValue: raw,
      quoteCur,
      ch: q?.change24hPct ?? null,
    });
  }

  const distinctQuoteCurrencies = [
    ...new Set(rows.map((r) => r.quoteCur)),
  ];
  const needsFx = portfolioNeedsFxUnification({
    quoteCurrencies: distinctQuoteCurrencies,
    displayCurrency,
    hasUsdCostBasis: hasCost,
  });

  const ratesReady = rates !== undefined && Object.keys(rates).length > 0;

  const allocation: AllocationSlice[] = [];
  let totalValue = 0;
  let totalCost: number | null = null;
  let hasMixedCurrencies: boolean;

  const convert = (amount: number, from: string, to: string) => {
    if (!rates) return null;
    return convertAmountViaBtcBridge(amount, from, to, rates);
  };

  if (!needsFx) {
    hasMixedCurrencies = false;
    for (const row of rows) {
      totalValue += row.rawValue;
      allocation.push({
        id: row.position.id,
        symbol: row.position.symbol.toUpperCase(),
        kind: row.position.kind,
        value: row.rawValue,
        weight: 0,
        currency: displayCurrency,
        ...(row.position.exchange?.trim()
          ? { exchange: row.position.exchange.trim() }
          : {}),
      });
    }
    if (hasCost) {
      totalCost = totalCostUsdBasis;
    }
  } else if (!ratesReady) {
    hasMixedCurrencies = true;
    for (const row of rows) {
      totalValue += row.rawValue;
      allocation.push({
        id: row.position.id,
        symbol: row.position.symbol.toUpperCase(),
        kind: row.position.kind,
        value: row.rawValue,
        weight: 0,
        currency: row.quoteCur,
        ...(row.position.exchange?.trim()
          ? { exchange: row.position.exchange.trim() }
          : {}),
      });
    }
  } else {
    let fxOk = true;
    const convertedValues: number[] = [];
    for (const row of rows) {
      const v = convert(row.rawValue, row.quoteCur, displayCurrency);
      if (v === null) {
        fxOk = false;
        break;
      }
      convertedValues.push(v);
    }
    let costConv: number | null = null;
    if (fxOk && hasCost) {
      costConv =
        displayCurrency === "USD"
          ? totalCostUsdBasis
          : convert(totalCostUsdBasis, "USD", displayCurrency);
      if (costConv === null) fxOk = false;
    }

    if (!fxOk) {
      hasMixedCurrencies = true;
      for (const row of rows) {
        totalValue += row.rawValue;
        allocation.push({
          id: row.position.id,
          symbol: row.position.symbol.toUpperCase(),
          kind: row.position.kind,
          value: row.rawValue,
          weight: 0,
          currency: row.quoteCur,
          ...(row.position.exchange?.trim()
            ? { exchange: row.position.exchange.trim() }
            : {}),
        });
      }
    } else {
      hasMixedCurrencies = false;
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i]!;
        const v = convertedValues[i]!;
        totalValue += v;
        allocation.push({
          id: row.position.id,
          symbol: row.position.symbol.toUpperCase(),
          kind: row.position.kind,
          value: v,
          weight: 0,
          currency: displayCurrency,
          ...(row.position.exchange?.trim()
            ? { exchange: row.position.exchange.trim() }
            : {}),
        });
      }
      if (hasCost) totalCost = costConv;
    }
  }

  for (const slice of allocation) {
    slice.weight =
      !hasMixedCurrencies && totalValue > 0 ? slice.value / totalValue : 0;
  }

  allocation.sort((a, b) => b.value - a.value);

  const pnl =
    hasCost && !hasMixedCurrencies && totalCost !== null
      ? totalValue - totalCost
      : null;
  const pnlPct =
    hasCost &&
    !hasMixedCurrencies &&
    totalCost !== null &&
    totalCost > 0 &&
    pnl !== null
      ? pnl / totalCost
      : null;

  let dayNum = 0;
  let dayDen = 0;
  if (!hasMixedCurrencies) {
    for (const slice of allocation) {
      const row = rows.find((r) => r.position.id === slice.id);
      if (!row) continue;
      const ch = row.ch;
      if (ch === null || ch === undefined || !Number.isFinite(ch)) continue;
      dayNum += slice.value * (ch / 100);
      dayDen += slice.value;
    }
  }

  const dayChangePct =
    !hasMixedCurrencies && dayDen > 0 ? dayNum / dayDen : null;
  const dayChange =
    !hasMixedCurrencies &&
    dayChangePct !== null &&
    Number.isFinite(dayChangePct)
      ? totalValue - totalValue / (1 + dayChangePct)
      : null;

  return {
    displayCurrency,
    totalValue,
    totalCost: hasCost && !hasMixedCurrencies ? totalCost : null,
    pnl,
    pnlPct,
    dayChange,
    dayChangePct,
    allocation,
    hasMixedCurrencies,
  };
}
