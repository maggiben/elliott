import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  DEFAULT_IOL_LISTING_EXCHANGES_CSV,
  iolListingPreferredExchanges,
  isIolListingPreferredExchange,
  listingQuotePageUrl,
} from "./vendor-config";

describe("vendor-config (IOL listing)", () => {
  const envKey = "NEXT_PUBLIC_IOL_LISTING_EXCHANGES";
  let prev: string | undefined;

  beforeEach(() => {
    prev = process.env[envKey];
    delete process.env[envKey];
  });

  afterEach(() => {
    if (prev === undefined) delete process.env[envKey];
    else process.env[envKey] = prev;
  });

  it("builds listing quote URLs with encoded exchange and symbol", () => {
    expect(listingQuotePageUrl("NYSE", "URA")).toBe(
      "https://iol.invertironline.com/titulo/cotizacion/NYSE/URA",
    );
    expect(listingQuotePageUrl("NASDAQ", "QQQ")).toBe(
      "https://iol.invertironline.com/titulo/cotizacion/NASDAQ/QQQ",
    );
    expect(listingQuotePageUrl("bcba", "GGAL")).toBe(
      "https://iol.invertironline.com/titulo/cotizacion/BCBA/GGAL",
    );
  });

  it("defaults include BCBA, NYSE, NASDAQ, and common US venues", () => {
    expect(iolListingPreferredExchanges()).toEqual(
      new Set(DEFAULT_IOL_LISTING_EXCHANGES_CSV.split(",").map((s) => s.trim())),
    );
    expect(isIolListingPreferredExchange("NYSE")).toBe(true);
    expect(isIolListingPreferredExchange("NASDAQ")).toBe(true);
    expect(isIolListingPreferredExchange("nyse")).toBe(true);
    expect(isIolListingPreferredExchange("BCBA")).toBe(true);
    expect(isIolListingPreferredExchange("AMEX")).toBe(true);
  });

  it("respects NEXT_PUBLIC_IOL_LISTING_EXCHANGES override", () => {
    process.env[envKey] = "NASDAQ, XETRA ";
    expect(iolListingPreferredExchanges()).toEqual(new Set(["NASDAQ", "XETRA"]));
    expect(isIolListingPreferredExchange("NASDAQ")).toBe(true);
    expect(isIolListingPreferredExchange("NYSE")).toBe(false);
  });

  it("empty NEXT_PUBLIC_IOL_LISTING_EXCHANGES disables IOL-first routing", () => {
    process.env[envKey] = "   ";
    expect(iolListingPreferredExchanges().size).toBe(0);
    expect(isIolListingPreferredExchange("NYSE")).toBe(false);
  });

  it("rejects blank exchange", () => {
    expect(isIolListingPreferredExchange(undefined)).toBe(false);
    expect(isIolListingPreferredExchange("")).toBe(false);
  });
});
