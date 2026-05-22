import { normalizeFromListingHtmlQuote } from "@/lib/market-data/normalize";
import type { MarketData } from "@/lib/market-data/types";
import { parseIolUdfHistoryJson } from "@/lib/providers/listing-html-bcba/parse-iol-udf-history";
import { parseListingHtmlQuote } from "@/lib/providers/listing-html-bcba/parse-listing-html";
import type { ChartPoint } from "@/lib/storage/market-cache-db";
import { isIolListingPreferredExchange, iolUdfChartsEnabled } from "./iol-config";
import {
  iolUdfHistoryUrl,
  listingQuotePageUrl,
} from "@/lib/providers/listing-html-bcba/vendor-config";
import { fetchRemoteHttps } from "./remote-fetch";

export async function fetchIolListingQuoteServer(
  symbol: string,
  exchange: string,
  signal?: AbortSignal,
): Promise<MarketData | null> {
  const sym = symbol.trim().toUpperCase();
  const ex = exchange.trim().toUpperCase();
  if (!sym || !ex || !isIolListingPreferredExchange(ex)) return null;

  const targetUrl = listingQuotePageUrl(ex, sym);
  let res: Response;
  try {
    res = await fetchRemoteHttps(targetUrl, { signal });
  } catch {
    return null;
  }
  if (!res.ok) return null;
  const html = await res.text();
  const parsed = parseListingHtmlQuote(html, sym, ex);
  if (!parsed) return null;
  return normalizeFromListingHtmlQuote(parsed);
}

export async function fetchIolUdfDailySeriesServer(
  symbol: string,
  exchange: string,
  days: number,
  signal?: AbortSignal,
): Promise<ChartPoint[]> {
  const sym = symbol.trim().toUpperCase();
  const ex = exchange.trim().toUpperCase();
  if (!iolUdfChartsEnabled()) return [];
  if (!sym || !ex || days < 1 || !isIolListingPreferredExchange(ex)) return [];

  const toSec = Math.floor(Date.now() / 1000);
  const fromSec = toSec - days * 86_400;
  const targetUrl = iolUdfHistoryUrl(sym, ex, fromSec, toSec, "D");

  let res: Response;
  try {
    res = await fetchRemoteHttps(targetUrl, {
      signal,
      headers: { Accept: "application/json" },
    });
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
