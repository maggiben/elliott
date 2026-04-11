/**
 * CoinGecko `/exchange_rates` expresses every currency in BTC terms: `value` is
 * units of that currency per 1 BTC. Converting A → B: `amountB = amountA * (R_b / R_a)`.
 */

export function convertAmountViaBtcBridge(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: Record<string, number>,
): number | null {
  if (!Number.isFinite(amount)) return null;
  const from = fromCurrency.trim().toLowerCase();
  const to = toCurrency.trim().toLowerCase();
  if (from === to) return amount;
  const rf = rates[from];
  const rt = rates[to];
  if (
    rf === undefined ||
    rt === undefined ||
    !Number.isFinite(rf) ||
    !Number.isFinite(rt) ||
    rf <= 0 ||
    rt <= 0
  ) {
    return null;
  }
  return amount * (rt / rf);
}

/** Cost basis in the app is always recorded in USD (`avgCostUsd`). */
export function portfolioNeedsFxUnification(params: {
  quoteCurrencies: string[];
  displayCurrency: string;
  hasUsdCostBasis: boolean;
}): boolean {
  const d = params.displayCurrency.trim().toLowerCase();
  if (params.hasUsdCostBasis && d !== "usd") return true;
  for (const c of params.quoteCurrencies) {
    if (c.trim().toLowerCase() !== d) return true;
  }
  return false;
}
