import { normalizeFromCoinGeckoSimple } from "@/lib/market-data/normalize";
import type { MarketData } from "@/lib/market-data/types";

const BASE = "https://api.coingecko.com/api/v3";

/** Fast path for common tickers to avoid search rate limits; includes display names for UI. */
const KNOWN_CRYPTO_BY_TICKER: Record<
  string,
  { id: string; name: string }
> = {
  BTC: { id: "bitcoin", name: "Bitcoin" },
  ETH: { id: "ethereum", name: "Ethereum" },
  SOL: { id: "solana", name: "Solana" },
  XRP: { id: "ripple", name: "XRP" },
  DOGE: { id: "dogecoin", name: "Dogecoin" },
  ADA: { id: "cardano", name: "Cardano" },
  AVAX: { id: "avalanche-2", name: "Avalanche" },
  DOT: { id: "polkadot", name: "Polkadot" },
  LINK: { id: "chainlink", name: "Chainlink" },
  MATIC: { id: "matic-network", name: "Polygon" },
  POL: { id: "matic-network", name: "Polygon" },
  LTC: { id: "litecoin", name: "Litecoin" },
  BCH: { id: "bitcoin-cash", name: "Bitcoin Cash" },
  ATOM: { id: "cosmos", name: "Cosmos" },
  UNI: { id: "uniswap", name: "Uniswap" },
  ARB: { id: "arbitrum", name: "Arbitrum" },
  OP: { id: "optimism", name: "Optimism" },
};

export type CoinGeckoSearchCoin = { id: string; name: string; symbol: string };

type SearchCoin = CoinGeckoSearchCoin;

type SearchResponse = { coins?: SearchCoin[] };

type SimplePriceResponse = Record<
  string,
  { usd?: number; usd_24h_change?: number }
>;

export async function coingeckoSearchTopCoin(
  query: string,
  signal?: AbortSignal,
): Promise<SearchCoin | null> {
  const q = query.trim();
  if (!q) return null;
  const upper = q.toUpperCase();
  const known = KNOWN_CRYPTO_BY_TICKER[upper];
  if (known) {
    return { id: known.id, name: known.name, symbol: upper };
  }

  const url = `${BASE}/search?query=${encodeURIComponent(q)}`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`CoinGecko search failed (${res.status})`);
  const body = (await res.json()) as SearchResponse;
  const coins = body.coins ?? [];
  const exact = coins.find((c) => c.symbol.toUpperCase() === upper);
  return exact ?? coins[0] ?? null;
}

/** Multiple matches for symbol autocomplete (CoinGecko `/search`). */
export async function coingeckoSearchCoins(
  query: string,
  opts?: { limit?: number; signal?: AbortSignal },
): Promise<CoinGeckoSearchCoin[]> {
  const limit = opts?.limit ?? 12;
  const q = query.trim();
  if (!q) return [];
  const upper = q.toUpperCase();
  const known = KNOWN_CRYPTO_BY_TICKER[upper];
  const out: CoinGeckoSearchCoin[] = [];

  if (known) {
    out.push({ id: known.id, name: known.name, symbol: upper });
  }

  const url = `${BASE}/search?query=${encodeURIComponent(q)}`;
  const res = await fetch(url, { signal: opts?.signal });
  if (!res.ok) throw new Error(`CoinGecko search failed (${res.status})`);
  const body = (await res.json()) as SearchResponse;
  const coins = body.coins ?? [];
  const seen = new Set(out.map((c) => c.id));
  for (const c of coins) {
    if (out.length >= limit) break;
    if (seen.has(c.id)) continue;
    seen.add(c.id);
    out.push({
      id: c.id,
      name: c.name,
      symbol: c.symbol.toUpperCase(),
    });
  }
  return out.slice(0, limit);
}

export async function coingeckoSimplePrice(
  coinIds: string[],
  signal?: AbortSignal,
): Promise<SimplePriceResponse> {
  const unique = [...new Set(coinIds)].filter(Boolean);
  if (unique.length === 0) return {};
  const url = `${BASE}/simple/price?ids=${encodeURIComponent(unique.join(","))}&vs_currencies=usd&include_24hr_change=true`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`CoinGecko price failed (${res.status})`);
  return (await res.json()) as SimplePriceResponse;
}

export async function fetchCryptoQuoteViaCoingecko(
  symbol: string,
  signal?: AbortSignal,
): Promise<MarketData | null> {
  const coin = await coingeckoSearchTopCoin(symbol, signal);
  if (!coin) return null;
  const prices = await coingeckoSimplePrice([coin.id], signal);
  const row = prices[coin.id];
  const usd = row?.usd;
  if (usd === undefined || !Number.isFinite(usd)) return null;
  return normalizeFromCoinGeckoSimple({
    coinId: coin.id,
    symbol: coin.symbol,
    displayName: coin.name,
    usd,
    usd24hChange: row.usd_24h_change,
  });
}

export async function coingeckoMarketChartUsd(
  coinId: string,
  days: number,
  signal?: AbortSignal,
): Promise<{ timeSec: number; value: number }[]> {
  const url = `${BASE}/coins/${encodeURIComponent(coinId)}/market_chart?vs_currency=usd&days=${days}`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`CoinGecko chart failed (${res.status})`);
  const body = (await res.json()) as { prices?: [number, number][] };
  const prices = body.prices ?? [];
  return prices.map(([ms, value]) => ({
    timeSec: Math.floor(ms / 1000),
    value,
  }));
}
