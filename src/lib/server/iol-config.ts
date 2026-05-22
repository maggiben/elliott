import { DEFAULT_IOL_LISTING_EXCHANGES_CSV } from "@/lib/providers/listing-html-bcba/vendor-config";

/** Parsed set; empty env string means “no IOL-first venues”. */
export function iolListingPreferredExchanges(): Set<string> {
  const raw = process.env.IOL_LISTING_EXCHANGES;
  const csv =
    raw === undefined || raw === null
      ? DEFAULT_IOL_LISTING_EXCHANGES_CSV
      : raw.trim();
  if (csv === "") return new Set<string>();
  const set = new Set<string>();
  for (const part of csv.split(",")) {
    const ex = part.trim().toUpperCase();
    if (ex) set.add(ex);
  }
  return set;
}

export function isIolListingPreferredExchange(
  exchange: string | undefined,
): boolean {
  const ex = exchange?.trim().toUpperCase();
  if (!ex) return false;
  return iolListingPreferredExchanges().has(ex);
}

/** Opt out: `IOL_UDF_CHARTS=0` or legacy `BCBA_IOL_CHARTS=0`. */
export function iolUdfChartsEnabled(): boolean {
  const primary = process.env.IOL_UDF_CHARTS?.trim().toLowerCase();
  if (primary === "0" || primary === "false" || primary === "off") return false;
  const legacy = process.env.BCBA_IOL_CHARTS?.trim().toLowerCase();
  if (legacy === "0" || legacy === "false" || legacy === "off") return false;
  return true;
}
