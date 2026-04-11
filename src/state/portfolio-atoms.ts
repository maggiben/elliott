import { atom } from "jotai";
import type { PortfolioPosition } from "@/lib/portfolio/types";

/** Canonical portfolio holdings (persisted to IndexedDB). */
export const portfolioAtom = atom<PortfolioPosition[]>([]);

/** True after IndexedDB hydration attempt finished. */
export const portfolioHydratedAtom = atom(false);
