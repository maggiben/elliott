import { fetchViaCorsfix } from "./corsfix-fetch";

/**
 * Fetch a public HTTPS URL from the Next.js server.
 * Tries a direct request first (no browser CORS); falls back to Corsfix when blocked or failing.
 */
export async function fetchRemoteHttps(
  targetHttpsUrl: string,
  init?: RequestInit,
): Promise<Response> {
  const headers = new Headers(init?.headers);
  if (!headers.has("User-Agent")) {
    headers.set("User-Agent", "Elliott/1.0 (portfolio tracker)");
  }
  if (!headers.has("Accept")) {
    headers.set("Accept", "text/html,application/json;q=0.9,*/*;q=0.8");
  }
  const baseInit: RequestInit = { ...init, cache: "no-store", headers };

  try {
    const direct = await fetch(targetHttpsUrl, baseInit);
    if (direct.ok) return direct;
  } catch {
    /* network / TLS — try Corsfix */
  }

  return fetchViaCorsfix(targetHttpsUrl, init);
}
