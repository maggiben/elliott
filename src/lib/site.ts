/** Display name in footer and legal pages. */
export const SITE_OWNER_NAME = "Benjamin Maggi LLC";

export const SITE_APP_NAME = "Elliott";

const DEFAULT_SITE_URL = "http://localhost:3000";

/** Canonical origin for metadata and Open Graph (build / SSR). */
export function siteUrl(): URL {
  if (process.env.VERCEL_URL) {
    return new URL(`https://${process.env.VERCEL_URL}`);
  }
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return new URL(configured);
  return new URL(DEFAULT_SITE_URL);
}
