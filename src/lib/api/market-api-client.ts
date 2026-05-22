const MARKET_API = "/api/market";

async function getMarketJson<T>(
  path: string,
  params: Record<string, string | number | undefined>,
  signal?: AbortSignal,
): Promise<T | null> {
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") continue;
    q.set(key, String(value));
  }
  const url = `${MARKET_API}${path}?${q.toString()}`;
  let res: Response;
  try {
    res = await fetch(url, { signal });
  } catch {
    return null;
  }
  if (!res.ok) return null;
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function fetchMarketListingQuote(
  symbol: string,
  exchange: string,
  signal?: AbortSignal,
): Promise<{ data: import("@/lib/market-data/types").MarketData | null } | null> {
  return getMarketJson("/iol/listing", { symbol, exchange }, signal);
}

export async function fetchMarketIolUdf(
  symbol: string,
  exchange: string,
  days: number,
  signal?: AbortSignal,
): Promise<{ points: import("@/lib/storage/market-cache-db").ChartPoint[] } | null> {
  return getMarketJson("/iol/udf", { symbol, exchange, days }, signal);
}

export async function fetchMarketTwelveDataPrice(
  symbol: string,
  exchange: string | undefined,
  signal?: AbortSignal,
): Promise<{ data: import("@/lib/market-data/types").MarketData | null } | null> {
  return getMarketJson("/twelvedata/price", { symbol, exchange }, signal);
}

export async function fetchMarketTwelveDataTimeSeries(
  symbol: string,
  outputsize: number,
  exchange: string | undefined,
  signal?: AbortSignal,
): Promise<{ points: { timeSec: number; value: number }[] } | null> {
  return getMarketJson(
    "/twelvedata/time-series",
    { symbol, outputsize, exchange },
    signal,
  );
}

export async function fetchMarketTwelveDataSymbolSearch(
  query: string,
  signal?: AbortSignal,
): Promise<{ hits: { symbol: string; instrumentName: string; exchange: string }[] } | null> {
  return getMarketJson("/twelvedata/symbol-search", { query }, signal);
}
