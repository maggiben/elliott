import type { AssetKind } from "@/lib/market-data/types";

/** Short label for UI (table, chart). */
export function assetKindUiLabel(kind: AssetKind): string {
  return kind === "crypto" ? "Crypto" : "Stock";
}

/** Longer label when space allows. */
export function assetKindUiLabelLong(kind: AssetKind): string {
  return kind === "crypto" ? "Cryptocurrency" : "Stock";
}
