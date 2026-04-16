/**
 * Parses server-rendered quote table fields (Spanish locale, ARS-style numbers).
 * Anchored on `data-field` attributes so layout/CSS can change more freely.
 */

import type { ListingHtmlParsedQuote } from "@/lib/market-data/listing-html-parsed";

/** Thousands `.`, decimal `,` (e.g. "58.200,00", "$ 295.347.475,00"). */
export function parseEsArNumberFragment(raw: string): number | null {
  const s = raw.replace(/\$/g, "").replace(/\s/g, "").trim();
  if (!s) return null;
  const normalized = s.replace(/\./g, "").replace(",", ".");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

function captureGroup(html: string, re: RegExp): string | null {
  const m = html.match(re);
  return m?.[1]?.trim() ?? null;
}

function parseUltimoPrecioBlock(
  html: string,
): { inner: string; price: number } | null {
  const inner = captureGroup(
    html,
    /data-field="UltimoPrecio"[^>]*>([^<]+)/i,
  );
  if (!inner) return null;
  const price = parseEsArNumberFragment(inner);
  if (price === null || price <= 0) return null;
  return { inner, price };
}

/** BCBA / IOL cells may label USD (U$S, US$, USD) vs peso ARS. */
function detectListingCurrencyFromUltimoCell(inner: string): "ARS" | "USD" {
  if (
    /U\$S|US\$|USD(?:\s|&nbsp;|$)|DOLAR(?:ES)?\s+ESTADOUNIDENSE/i.test(inner)
  ) {
    return "USD";
  }
  return "ARS";
}

function listingCurrency(
  inner: string,
  listingExchange?: string,
): "ARS" | "USD" {
  const ex = listingExchange?.trim().toUpperCase();
  /** BCBA can be ARS or USD (cell markers); other IOL international listings are USD-priced. */
  if (ex === "BCBA") return detectListingCurrencyFromUltimoCell(inner);
  if (ex) return "USD";
  return detectListingCurrencyFromUltimoCell(inner);
}

function parseVariacionPct(html: string): number | null {
  const inner = captureGroup(
    html,
    /data-field="Variacion"[^>]*>([^<]+)/i,
  );
  return inner ? parseEsArNumberFragment(inner) : null;
}

function parseVolumenNominal(html: string): number | null {
  const block = captureGroup(
    html,
    /data-field="VolumenNominal"[^>]*>([^<]+)/i,
  );
  if (!block) return null;
  const q = block.match(/Q:\s*([\d.]+)/i);
  if (!q?.[1]) return null;
  const n = Number(q[1].replace(/\./g, ""));
  return Number.isFinite(n) ? n : null;
}

function parseMontoOperado(html: string): number | null {
  const inner = captureGroup(
    html,
    /data-field="MontoOperado"[^>]*>([^<]+)/i,
  );
  return inner ? parseEsArNumberFragment(inner) : null;
}

function parseMinMax(html: string, field: "Maximo" | "Minimo"): number | null {
  const inner = captureGroup(html, new RegExp(`data-field="${field}"[^>]*>([^<]+)`, "i"));
  if (!inner) return null;
  const tail = inner.replace(/^.*?\$\s*/i, "").trim();
  return parseEsArNumberFragment(tail);
}

function parseDisplayName(html: string): string | null {
  const block = captureGroup(
    html,
    /<h1[^>]*class="[^"]*header-title[^"]*"[^>]*>([\s\S]*?)<\/h1>/i,
  );
  if (!block) return null;
  const beforeSmall = block.split(/<small\b/i)[0];
  const text = beforeSmall.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return text || null;
}

export function parseListingHtmlQuote(
  html: string,
  symbol: string,
  listingExchange?: string,
): ListingHtmlParsedQuote | null {
  const ultimo = parseUltimoPrecioBlock(html);
  if (!ultimo) return null;
  const sym = symbol.trim().toUpperCase();
  return {
    symbol: sym,
    displayName: parseDisplayName(html),
    currency: listingCurrency(ultimo.inner, listingExchange),
    price: ultimo.price,
    changeDayPct: parseVariacionPct(html),
    volumeNominal: parseVolumenNominal(html),
    volumeMoneyArs: parseMontoOperado(html),
    highDay: parseMinMax(html, "Maximo"),
    lowDay: parseMinMax(html, "Minimo"),
  };
}
