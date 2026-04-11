import type { AssetKind } from "@/lib/market-data/types";

/** Short label for UI (table, chart). */
export function assetKindUiLabel(kind: AssetKind): string {
  if (kind === "crypto") return "Crypto";
  if (kind === "fixed_income") return "Plazo";
  return "Stock";
}

/** Longer label when space allows. */
export function assetKindUiLabelLong(kind: AssetKind): string {
  if (kind === "crypto") return "Cryptocurrency";
  if (kind === "fixed_income") return "Fixed term (plazo fijo)";
  return "Stock";
}
