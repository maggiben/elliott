import { nanoid } from "nanoid";
import type { PortfolioPosition } from "./types";

/** Strips accidental autocomplete labels (`TICKER — Name …`) from stored symbol. */
export function normalizePortfolioSymbol(raw: string): string {
  let s = raw.trim();
  const sep = " — ";
  if (s.includes(sep)) s = s.split(sep)[0]!.trim();
  return s.toUpperCase();
}

export function addPosition(
  list: PortfolioPosition[],
  draft: Omit<PortfolioPosition, "id"> & { id?: string },
): PortfolioPosition[] {
  const { exchange, ...rest } = draft;
  const exchangeTrim = typeof exchange === "string" ? exchange.trim() : "";
  const next: PortfolioPosition = {
    ...rest,
    symbol: normalizePortfolioSymbol(draft.symbol),
    id: draft.id ?? nanoid(12),
    ...(exchangeTrim ? { exchange: exchangeTrim } : {}),
  };
  return [...list, next];
}

export function updatePosition(
  list: PortfolioPosition[],
  id: string,
  patch: Partial<Omit<PortfolioPosition, "id">>,
): PortfolioPosition[] {
  return list.map((p) => {
    if (p.id !== id) return p;
    const next: PortfolioPosition = {
      ...p,
      ...patch,
      symbol:
        patch.symbol !== undefined
          ? normalizePortfolioSymbol(patch.symbol)
          : p.symbol,
    };
    if ("exchange" in patch) {
      const ex =
        typeof patch.exchange === "string" ? patch.exchange.trim() : "";
      if (ex) next.exchange = ex;
      else delete next.exchange;
    }
    if (patch.kind !== undefined && patch.kind !== "fixed_income") {
      delete next.fixedIncomeAnnualRatePct;
      delete next.fixedIncomeStartDate;
      delete next.fixedIncomeMaturityDate;
      delete next.fixedIncomeCurrency;
    }
    if (next.kind !== "crypto") {
      delete next.cryptoApyPct;
    } else if ("cryptoApyPct" in patch) {
      const y = patch.cryptoApyPct;
      if (
        y === undefined ||
        y === null ||
        (typeof y === "number" && !Number.isFinite(y))
      ) {
        delete next.cryptoApyPct;
      } else {
        next.cryptoApyPct = y;
      }
    }
    if (next.kind === "fixed_income") {
      delete next.exchange;
    }
    return next;
  });
}

export function removePosition(
  list: PortfolioPosition[],
  id: string,
): PortfolioPosition[] {
  return list.filter((p) => p.id !== id);
}
