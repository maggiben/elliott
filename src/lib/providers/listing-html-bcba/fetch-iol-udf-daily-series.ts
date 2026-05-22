import { fetchMarketIolUdf } from "@/lib/api/market-api-client";
import type { ChartPoint } from "@/lib/storage/market-cache-db";

/**
 * Daily series from IOL UDF via `/api/market/iol/udf`.
 * Server applies chart opt-out and exchange allowlist. Returns [] on failure.
 */
export async function fetchIolUdfDailySeries(
  symbol: string,
  exchange: string,
  days: number,
  signal?: AbortSignal,
): Promise<ChartPoint[]> {
  const sym = symbol.trim().toUpperCase();
  const ex = exchange.trim().toUpperCase();
  if (!sym || !ex || days < 1) return [];

  const body = await fetchMarketIolUdf(sym, ex, days, signal);
  return body?.points ?? [];
}
