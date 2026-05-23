/** Display name in footer and legal pages. */
export const SITE_OWNER_NAME = "Benjamin Maggi LLC";

export const SITE_APP_NAME = "Elliott";

/** Short description for meta tags, Open Graph, and JSON-LD. */
export const SITE_DESCRIPTION =
  "Track stocks, crypto, and fixed income in your browser. Portfolio data stays on your device in IndexedDB with live public market quotes.";

const DEFAULT_SITE_URL = "http://localhost:3000";

/** Canonical origin for metadata and Open Graph (build / SSR). */
export function siteUrl(): URL {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return new URL(configured);
  if (process.env.VERCEL_URL) {
    return new URL(`https://${process.env.VERCEL_URL}`);
  }
  return new URL(DEFAULT_SITE_URL);
}
