import type { Metadata } from "next";
import {
  SITE_APP_NAME,
  SITE_DESCRIPTION,
  SITE_OWNER_NAME,
  siteUrl,
} from "@/lib/site";

const SITE_KEYWORDS = [
  "portfolio tracker",
  "investment portfolio",
  "stocks",
  "crypto",
  "IndexedDB",
  "client-side",
  "market data",
  "net worth",
];

function absoluteUrl(path = "/"): string {
  return new URL(path, siteUrl()).href;
}

/** Default metadata for the root layout. */
export function rootMetadata(): Metadata {
  const canonical = absoluteUrl("/");
  const title = `${SITE_APP_NAME} · Portfolio tracker`;

  return {
    metadataBase: siteUrl(),
    title: {
      default: title,
      template: `%s · ${SITE_APP_NAME}`,
    },
    description: SITE_DESCRIPTION,
    applicationName: SITE_APP_NAME,
    keywords: SITE_KEYWORDS,
    authors: [{ name: SITE_OWNER_NAME }],
    creator: SITE_OWNER_NAME,
    publisher: SITE_OWNER_NAME,
    category: "finance",
    robots: { index: true, follow: true },
    alternates: { canonical },
    openGraph: {
      type: "website",
      locale: "en_US",
      url: canonical,
      siteName: SITE_APP_NAME,
      title,
      description: SITE_DESCRIPTION,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: SITE_DESCRIPTION,
    },
    icons: {
      icon: [{ url: "/favicon.ico", sizes: "any" }],
      apple: [{ url: "/favicon.ico", sizes: "any" }],
    },
  };
}

/** Per-page metadata with canonical path and optional overrides. */
export function pageMetadata({
  title,
  description = SITE_DESCRIPTION,
  path = "/",
  noIndex = false,
}: {
  title: string;
  description?: string;
  path?: string;
  noIndex?: boolean;
}): Metadata {
  const canonical = absoluteUrl(path);
  const fullTitle = `${title} · ${SITE_APP_NAME}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title: fullTitle,
      description,
      url: canonical,
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
    },
    ...(noIndex ? { robots: { index: false, follow: false } } : {}),
  };
}

/** JSON-LD for WebApplication (home). */
export function webApplicationJsonLd(): Record<string, unknown> {
  const url = siteUrl().href;
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: SITE_APP_NAME,
    description: SITE_DESCRIPTION,
    url,
    applicationCategory: "FinanceApplication",
    operatingSystem: "Any",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    featureList: [
      "Client-side portfolio storage",
      "Live public market quotes",
      "Allocation and KPI views",
      "Export and import backups",
    ],
  };
}
