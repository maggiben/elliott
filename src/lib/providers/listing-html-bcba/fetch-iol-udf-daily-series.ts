import { fetchViaCorsfix } from "@/lib/api/corsfix";
import type { ChartPoint } from "@/lib/storage/market-cache-db";
import { parseIolUdfHistoryJson } from "./parse-iol-udf-history";
import { iolUdfHistoryUrl } from "./vendor-config";

/**
 * Opt out without removing code: `NEXT_PUBLIC_BCBA_IOL_CHARTS=0`
 */
function bcbaIolChartsEnabled(): boolean {
  const v = process.env.NEXT_PUBLIC_BCBA_IOL_CHARTS?.trim().toLowerCase();
  return v !== "0" && v !== "false" && v !== "off";
}

/**
 * BCBA daily series from IOL's public UDF history endpoint (same feed as their TradingView graficador).
 * Returns [] on network/CORS/parse failures so callers can fall back (e.g. TwelveData).
 */
export async function fetchBcbaIolUdfDailySeries(
  symbol: string,
  days: number,
  signal?: AbortSignal,
): Promise<ChartPoint[]> {
  if (!bcbaIolChartsEnabled()) return [];
  const sym = symbol.trim().toUpperCase();
  if (!sym || days < 1) return [];

  const toSec = Math.floor(Date.now() / 1000);
  const fromSec = toSec - days * 86_400;
  const targetUrl = iolUdfHistoryUrl(sym, "BCBA", fromSec, toSec, "D");

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
