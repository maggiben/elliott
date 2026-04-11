import { atom } from "jotai";
import type { AssetKind } from "@/lib/market-data/types";

export const chartDaysAtom = atom<7 | 30 | 90>(7);

export const chartSelectionAtom = atom<{
  symbol: string;
  kind: AssetKind;
  /** TwelveData listing (e.g. BCBA for CEDEARs); must match quotes & history. */
  exchange?: string;
  /** Resolved from live quote, position name, or symbol search when adding. */
  displayName?: string;
} | null>(null);

export type PositionDialogState =
  | { mode: "create"; nonce: number }
  | { mode: "edit"; id: string };

export const positionDialogAtom = atom<PositionDialogState | null>(null);
