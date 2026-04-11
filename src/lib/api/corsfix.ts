/** Corsfix browser proxy — see https://corsfix.com/docs/cors-proxy/api */
const PROXY_ORIGIN = "https://proxy.corsfix.com";

/**
 * Build the proxy request URL. Corsfix expects the target as the query value in
 * the form `proxy/?https://host/path` — **not** `proxy/?https%3A%2F%2F...`.
 * Percent-encoding the whole target breaks routing and often yields a non-CORS
 * error body (the browser then reports a CORS failure).
 *
 * If the target contains `&` or `#`, fall back to the documented `url=` param.
 */
export function corsfixProxyUrl(targetHttpsUrl: string): string {
  const t = targetHttpsUrl.trim();
  if (t.includes("&") || t.includes("#")) {
    return `${PROXY_ORIGIN}/?url=${encodeURIComponent(t)}`;
  }
  return `${PROXY_ORIGIN}/?${t}`;
}

export function corsfixRequestHeaders(): Record<string, string> {
  const key = process.env.NEXT_PUBLIC_CORSFIX_API_KEY?.trim();
  if (!key) return {};
  return { "x-corsfix-key": key };
}

export async function fetchViaCorsfix(
  targetHttpsUrl: string,
  init?: RequestInit,
): Promise<Response> {
  const url = corsfixProxyUrl(targetHttpsUrl);
  const headers = new Headers(init?.headers);
  for (const [k, v] of Object.entries(corsfixRequestHeaders())) {
    headers.set(k, v);
  }
  return fetch(url, { ...init, headers });
}
