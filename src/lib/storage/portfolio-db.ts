import { openDB, type IDBPDatabase } from "idb";
import { normalizePortfolioSymbol } from "@/lib/portfolio/mutations";
import type { PortfolioPosition } from "@/lib/portfolio/types";

const DB = "elliott-portfolio";
const VERSION = 1;
const STORE = "kv";

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB, VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE);
        }
      },
    });
  }
  return dbPromise;
}

const PORTFOLIO_KEY = "portfolio-v1";

type LegacyRow = PortfolioPosition & { label?: string };

function migrateRow(row: unknown): PortfolioPosition | null {
  if (!row || typeof row !== "object") return null;
  const r = row as LegacyRow;
  if (typeof r.id !== "string" || typeof r.symbol !== "string") return null;

  const { label, ...rest } = r;
  const legacyPathKey = "i" + "ol" + "CotizacionPath";
  if (legacyPathKey in rest) {
    delete (rest as Record<string, unknown>)[legacyPathKey];
  }
  const nameFromLegacy =
    (typeof rest.name === "string" && rest.name.trim()) ||
    (typeof label === "string" && label.trim()) ||
    undefined;

  return {
    ...rest,
    symbol: normalizePortfolioSymbol(r.symbol),
    ...(nameFromLegacy ? { name: nameFromLegacy } : {}),
  };
}

export async function loadPortfolioFromIdb(): Promise<PortfolioPosition[]> {
  const db = await getDb();
  const raw = await db.get(STORE, PORTFOLIO_KEY);
  if (!Array.isArray(raw)) return [];
  return raw
    .map(migrateRow)
    .filter((p): p is PortfolioPosition => p !== null);
}

export async function savePortfolioToIdb(
  positions: PortfolioPosition[],
): Promise<void> {
  const db = await getDb();
  await db.put(STORE, positions, PORTFOLIO_KEY);
}
