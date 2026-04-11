export function formatUsd(value: number): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: Math.abs(value) >= 100 ? 0 : 2,
    minimumFractionDigits: 0,
  }).format(value);
}

export function formatQuoteMoney(value: number, currency: string): string {
  const c = currency.trim().toUpperCase() || "USD";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: c,
      maximumFractionDigits: Math.abs(value) >= 100 ? 0 : 2,
      minimumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${c}`;
  }
}

/** `ratio` is a fraction (0.052 => 5.2%). */
export function formatPercentFromRatio(ratio: number): string {
  return `${(ratio * 100).toFixed(2)}%`;
}

/** `points` is in percentage points (-5 => -5%). */
export function formatPercentPoints(points: number): string {
  return `${points.toFixed(2)}%`;
}
