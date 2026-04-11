const BASE = "https://api.coingecko.com/api/v3";

type ExchangeRatesBody = {
  rates?: Record<string, { value?: number }>;
};

/**
 * CoinGecko global `/exchange_rates`: each entry's `value` is how many units of
 * that currency equal 1 BTC (fiat and crypto buckets share the same scale).
 */
export async function fetchCoingeckoExchangeRates(
  signal?: AbortSignal,
): Promise<Record<string, number>> {
  const url = `${BASE}/exchange_rates`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`CoinGecko exchange_rates failed (${res.status})`);
  const body = (await res.json()) as ExchangeRatesBody;
  const out: Record<string, number> = {};
  for (const [key, row] of Object.entries(body.rates ?? {})) {
    const v = row?.value;
    if (typeof v === "number" && Number.isFinite(v) && v > 0) {
      out[key.toLowerCase()] = v;
    }
  }
  return out;
}
