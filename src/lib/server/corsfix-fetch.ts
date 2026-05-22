import { corsfixProxyUrl } from "@/lib/api/corsfix-url";
import { corsfixApiKey } from "./env";

export function corsfixRequestHeaders(): Record<string, string> {
  const key = corsfixApiKey();
  if (!key) return {};
  return { "x-corsfix-key": key };
}

/** Server-side fetch through Corsfix (keys stay on the server). */
export async function fetchViaCorsfix(
  targetHttpsUrl: string,
  init?: RequestInit,
): Promise<Response> {
  const url = corsfixProxyUrl(targetHttpsUrl);
  const headers = new Headers(init?.headers);
  for (const [k, v] of Object.entries(corsfixRequestHeaders())) {
    headers.set(k, v);
  }
  return fetch(url, { ...init, headers, cache: "no-store" });
}
