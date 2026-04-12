import type { AssetKind, MarketData, QuoteKey } from "@/lib/market-data/types";
import { normalizeStoredPosition, savePortfolioToIdb } from "@/lib/storage/portfolio-db";
import {
  replaceExchangeRatesCache,
  replaceQuotesCache,
} from "@/lib/storage/market-cache-db";
import type { PortfolioPosition } from "./types";

export const ELLIOTT_BACKUP_FORMAT = "elliott-backup" as const;

export type ElliottBackupV1 = {
  format: typeof ELLIOTT_BACKUP_FORMAT;
  version: 1;
  exportedAt: string;
  portfolio: PortfolioPosition[];
  /** Book / KPI display currency from settings. */
  bookCurrency?: string;
  market?: {
    quotes: Record<string, MarketData>;
    exchangeRates: Record<string, number>;
  };
};

const ALLOWED_BOOK = new Set([
  "USD",
  "ARS",
  "EUR",
  "GBP",
  "BRL",
  "BTC",
]);

const ASSET_KINDS = new Set<AssetKind>(["crypto", "equity", "fixed_income"]);

function isWellFormedPosition(p: PortfolioPosition): boolean {
  if (!ASSET_KINDS.has(p.kind)) return false;
  if (typeof p.quantity !== "number" || !Number.isFinite(p.quantity))
    return false;
  return true;
}

function isMarketData(x: unknown): x is MarketData {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  const kind = o.kind;
  if (kind !== "crypto" && kind !== "equity" && kind !== "fixed_income") {
    return false;
  }
  if (typeof o.symbol !== "string" || typeof o.displayName !== "string") {
    return false;
  }
  if (typeof o.price !== "number" || !Number.isFinite(o.price)) return false;
  if (typeof o.currency !== "string") return false;
  if (o.change24hPct !== null && typeof o.change24hPct !== "number") {
    return false;
  }
  if (o.volume24h !== null && typeof o.volume24h !== "number") return false;
  if (o.high24h !== null && typeof o.high24h !== "number") return false;
  if (o.low24h !== null && typeof o.low24h !== "number") return false;
  if (typeof o.lastUpdatedMs !== "number" || !Number.isFinite(o.lastUpdatedMs)) {
    return false;
  }
  if (typeof o.source !== "string") return false;
  return true;
}

function parseMarketSection(raw: unknown): ElliottBackupV1["market"] | undefined {
  if (raw === undefined) return undefined;
  if (!raw || typeof raw !== "object") return undefined;
  const m = raw as Record<string, unknown>;
  const quotesOut: Record<string, MarketData> = {};
  if (m.quotes && typeof m.quotes === "object") {
    for (const [k, v] of Object.entries(m.quotes as Record<string, unknown>)) {
      if (typeof k === "string" && isMarketData(v)) quotesOut[k] = v;
    }
  }
  const ratesOut: Record<string, number> = {};
  if (m.exchangeRates && typeof m.exchangeRates === "object") {
    for (const [k, v] of Object.entries(
      m.exchangeRates as Record<string, unknown>,
    )) {
      if (typeof k === "string" && typeof v === "number" && Number.isFinite(v)) {
        ratesOut[k] = v;
      }
    }
  }
  if (Object.keys(quotesOut).length === 0 && Object.keys(ratesOut).length === 0) {
    return undefined;
  }
  return { quotes: quotesOut, exchangeRates: ratesOut };
}

export type BackupParseResult =
  | { ok: true; data: ElliottBackupV1 }
  | { ok: false; error: string };

export function parseElliottBackupJson(text: string): BackupParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch {
    return { ok: false, error: "File is not valid JSON." };
  }
  if (!parsed || typeof parsed !== "object") {
    return { ok: false, error: "Backup root must be an object." };
  }
  const root = parsed as Record<string, unknown>;
  if (root.format !== ELLIOTT_BACKUP_FORMAT) {
    return {
      ok: false,
      error: `Unrecognized format (expected "${ELLIOTT_BACKUP_FORMAT}").`,
    };
  }
  if (root.version !== 1) {
    return { ok: false, error: "Unsupported backup version." };
  }
  if (typeof root.exportedAt !== "string" || !root.exportedAt.trim()) {
    return { ok: false, error: "Missing or invalid exportedAt." };
  }
  if (!Array.isArray(root.portfolio)) {
    return { ok: false, error: "Missing portfolio array." };
  }
  const portfolio: PortfolioPosition[] = [];
  for (const row of root.portfolio) {
    const p = normalizeStoredPosition(row);
    if (p && isWellFormedPosition(p)) portfolio.push(p);
  }
  let bookCurrency: string | undefined;
  if (root.bookCurrency !== undefined) {
    if (typeof root.bookCurrency !== "string") {
      return { ok: false, error: "Invalid bookCurrency." };
    }
    const bc = root.bookCurrency.trim().toUpperCase();
    if (ALLOWED_BOOK.has(bc)) bookCurrency = bc;
  }
  const market = parseMarketSection(root.market);
  return {
    ok: true,
    data: {
      format: ELLIOTT_BACKUP_FORMAT,
      version: 1,
      exportedAt: root.exportedAt.trim(),
      portfolio,
      ...(bookCurrency ? { bookCurrency } : {}),
      ...(market ? { market } : {}),
    },
  };
}

export function buildElliottBackupV1(input: {
  portfolio: PortfolioPosition[];
  bookCurrency: string;
  quotes: Record<string, MarketData>;
  exchangeRates: Record<string, number>;
}): ElliottBackupV1 {
  const bc = input.bookCurrency.trim().toUpperCase();
  return {
    format: ELLIOTT_BACKUP_FORMAT,
    version: 1,
    exportedAt: new Date().toISOString(),
    portfolio: input.portfolio,
    ...(ALLOWED_BOOK.has(bc) ? { bookCurrency: bc } : {}),
    market: {
      quotes: { ...input.quotes },
      exchangeRates: { ...input.exchangeRates },
    },
  };
}

/**
 * Writes portfolio and optional market cache from a parsed backup.
 * Call after updating Jotai state so UI matches IDB.
 */
export async function persistElliottBackup(data: ElliottBackupV1): Promise<void> {
  await savePortfolioToIdb(data.portfolio);
  if (data.market) {
    await replaceQuotesCache(data.market.quotes as Record<QuoteKey, MarketData>);
    await replaceExchangeRatesCache(data.market.exchangeRates);
  } else {
    await replaceQuotesCache({} as Record<QuoteKey, MarketData>);
    await replaceExchangeRatesCache({});
  }
}
