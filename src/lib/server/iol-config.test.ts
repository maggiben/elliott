import { afterEach, describe, expect, it } from "vitest";
import { DEFAULT_IOL_LISTING_EXCHANGES_CSV } from "@/lib/providers/listing-html-bcba/vendor-config";
import {
  iolListingPreferredExchanges,
  isIolListingPreferredExchange,
} from "./iol-config";

describe("iol-config", () => {
  const envKey = "IOL_LISTING_EXCHANGES";
  const prev = process.env[envKey];

  afterEach(() => {
    if (prev === undefined) delete process.env[envKey];
    else process.env[envKey] = prev;
  });

  it("defaults to BCBA, NYSE, NASDAQ, AMEX, ARCA, BATS when env unset", () => {
    delete process.env[envKey];
    const expected = new Set(
      DEFAULT_IOL_LISTING_EXCHANGES_CSV.split(",").map((s) => s.trim()),
    );
    expect(iolListingPreferredExchanges()).toEqual(expected);
    expect(isIolListingPreferredExchange("NYSE")).toBe(true);
    expect(isIolListingPreferredExchange("NASDAQ")).toBe(true);
    expect(isIolListingPreferredExchange("nyse")).toBe(true);
    expect(isIolListingPreferredExchange("BCBA")).toBe(true);
    expect(isIolListingPreferredExchange("AMEX")).toBe(true);
  });

  it("respects IOL_LISTING_EXCHANGES override", () => {
    process.env[envKey] = "NASDAQ,XETRA";
    expect(iolListingPreferredExchanges()).toEqual(new Set(["NASDAQ", "XETRA"]));
    expect(isIolListingPreferredExchange("NASDAQ")).toBe(true);
    expect(isIolListingPreferredExchange("NYSE")).toBe(false);
  });

  it("empty IOL_LISTING_EXCHANGES disables IOL-first routing", () => {
    process.env[envKey] = "";
    expect(iolListingPreferredExchanges().size).toBe(0);
    expect(isIolListingPreferredExchange("NYSE")).toBe(false);
  });

  it("treats missing exchange as not preferred", () => {
    expect(isIolListingPreferredExchange(undefined)).toBe(false);
    expect(isIolListingPreferredExchange("")).toBe(false);
  });
});
