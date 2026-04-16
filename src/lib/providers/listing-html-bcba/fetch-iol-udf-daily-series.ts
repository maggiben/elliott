import { fetchViaCorsfix } from "@/lib/api/corsfix";
import type { ChartPoint } from "@/lib/storage/market-cache-db";
import { parseIolUdfHistoryJson } from "./parse-iol-udf-history";
import { iolUdfHistoryUrl, isIolListingPreferredExchange } from "./vendor-config";

/**
 * Opt out without removing code: `NEXT_PUBLIC_IOL_UDF_CHARTS=0` or legacy
 * `NEXT_PUBLIC_BCBA_IOL_CHARTS=0`.
 */
function iolUdfChartsEnabled(): boolean {
  const primary = process.env.NEXT_PUBLIC_IOL_UDF_CHARTS?.trim().toLowerCase();
  if (primary === "0" || primary === "false" || primary === "off") return false;
  const legacy = process.env.NEXT_PUBLIC_BCBA_IOL_CHARTS?.trim().toLowerCase();
  if (legacy === "0" || legacy === "false" || legacy === "off") return false;
  return true;
}

/**
 * Daily series from IOL's public UDF history endpoint (same feed as their TradingView graficador).
 * Returns [] on network/CORS/parse failures so callers can fall back (e.g. TwelveData).
 */
export async function fetchIolUdfDailySeries(
  symbol: string,
  exchange: string,
  days: number,
  signal?: AbortSignal,
): Promise<ChartPoint[]> {
  if (!iolUdfChartsEnabled()) return [];
  const sym = symbol.trim().toUpperCase();
  const ex = exchange.trim().toUpperCase();
  if (!sym || !ex || days < 1 || !isIolListingPreferredExchange(ex)) return [];

  const toSec = Math.floor(Date.now() / 1000);
  const fromSec = toSec - days * 86_400;
  const targetUrl = iolUdfHistoryUrl(sym, ex, fromSec, toSec, "D");

  let res: Response;
  try {
    res = await fetchViaCorsfix(targetUrl, { signal });
  } catch {
    return [];
  }
  if (!res.ok) return [];

  let body: unknown;
  try {
    body = await res.json();
  } catch {
    return [];
  }

  return parseIolUdfHistoryJson(body);
}
