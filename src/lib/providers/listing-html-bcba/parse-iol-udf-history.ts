import type { ChartPoint } from "@/lib/storage/market-cache-db";

type UdfBar = {
  time?: unknown;
  close?: unknown;
};

/**
 * Parse `/api/cotizaciones/history` JSON (TradingView UDF shape).
 * Isolated so HTML/AJAX layout changes elsewhere do not require touching this.
 */
export function parseIolUdfHistoryJson(body: unknown): ChartPoint[] {
  if (!body || typeof body !== "object") return [];
  const o = body as Record<string, unknown>;
  if (o.status !== "ok" && o.status !== "no_data") return [];
  if (!Array.isArray(o.bars)) return [];

  const out: ChartPoint[] = [];
  for (const row of o.bars as UdfBar[]) {
    if (!row || typeof row !== "object") continue;
    const t =
      typeof row.time === "number"
        ? row.time
        : typeof row.time === "string"
          ? Number(row.time)
          : NaN;
    const v =
      row.close !== undefined && row.close !== null
        ? Number(row.close)
        : NaN;
    if (!Number.isFinite(t) || !Number.isFinite(v)) continue;
    out.push({ timeSec: Math.floor(t), value: v });
  }

  out.sort((a, b) => a.timeSec - b.timeSec);
  return out;
}
