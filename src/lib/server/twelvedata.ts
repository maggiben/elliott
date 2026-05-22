import { normalizeFromTwelveDataPrice } from "@/lib/market-data/normalize";
import type { MarketData } from "@/lib/market-data/types";
import { twelvedataApiKey } from "./env";

const BASE = "https://api.twelvedata.com";

type PriceBody = {
  price?: string;
  currency?: string;
  symbol?: string;
  status?: string;
  message?: string;
};

function twelveDataSymbolQueryParams(symbol: string, exchange?: string): string {
  const sym = symbol.trim().toUpperCase();
  const ex = exchange?.trim();
  const q = new URLSearchParams({ symbol: sym, apikey: twelvedataApiKey() });
  if (ex) q.set("exchange", ex);
  return q.toString();
}

export async function fetchTwelveDataPrice(
  symbol: string,
  signal?: AbortSignal,
  exchange?: string,
): Promise<MarketData | null> {
  const sym = symbol.trim().toUpperCase();
  const url = `${BASE}/price?${twelveDataSymbolQueryParams(sym, exchange)}`;
  const res = await fetch(url, { signal, cache: "no-store" });
  if (!res.ok) return null;
  const body = (await res.json()) as PriceBody;
  if (body.status === "error") return null;
  const price = body.price !== undefined ? Number(body.price) : NaN;
  if (!Number.isFinite(price)) return null;
  return normalizeFromTwelveDataPrice({
    symbol: body.symbol ?? sym,
    price,
    currency: body.currency ?? "USD",
  });
}

type TimeSeriesBody = {
  values?: { datetime: string; open: string }[];
  status?: string;
};

export type TwelveDataSymbolHit = {
  symbol: string;
  instrumentName: string;
  exchange: string;
};

type SymbolSearchBody = {
  data?: {
    symbol: string;
    instrument_name: string;
    exchange: string;
  }[];
  status?: string;
};

export async function twelveDataSymbolSearch(
  query: string,
  signal?: AbortSignal,
): Promise<TwelveDataSymbolHit[]> {
  const q = query.trim();
  if (!q) return [];
  const url = `${BASE}/symbol_search?symbol=${encodeURIComponent(q)}&apikey=${encodeURIComponent(twelvedataApiKey())}`;
  const res = await fetch(url, { signal, cache: "no-store" });
  if (!res.ok) return [];
  const body = (await res.json()) as SymbolSearchBody;
  if (body.status === "error" || !body.data) return [];
  return body.data.slice(0, 12).map((row) => ({
    symbol: row.symbol.toUpperCase(),
    instrumentName: row.instrument_name,
    exchange: row.exchange,
  }));
}

export async function fetchTwelveDataTimeSeries(
  symbol: string,
  outputsize: number,
  signal?: AbortSignal,
  exchange?: string,
): Promise<{ timeSec: number; value: number }[]> {
  const sym = symbol.trim().toUpperCase();
  const q = new URLSearchParams({
    symbol: sym,
    interval: "1day",
    outputsize: String(outputsize),
    apikey: twelvedataApiKey(),
  });
  const ex = exchange?.trim();
  if (ex) q.set("exchange", ex);
  const url = `${BASE}/time_series?${q.toString()}`;
  const res = await fetch(url, { signal, cache: "no-store" });
  if (!res.ok) return [];
  const body = (await res.json()) as TimeSeriesBody;
  if (body.status === "error" || !body.values) return [];
  return body.values
    .map((row) => {
      const t = Date.parse(row.datetime);
      const v = Number(row.open);
      if (!Number.isFinite(t) || !Number.isFinite(v)) return null;
      return { timeSec: Math.floor(t / 1000), value: v };
    })
    .filter((p): p is { timeSec: number; value: number } => p !== null)
    .reverse();
}
