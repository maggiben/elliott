import { describe, expect, it } from "vitest";
import {
  isWithinMarketFetchTtl,
  MARKET_FETCH_TTL_MS,
  portfolioQuotesNeedNetworkFetch,
} from "./market-fetch-ttl";
import { positionQuoteKey } from "@/lib/market-data/types";
import type { PortfolioPosition } from "@/lib/portfolio/types";

describe("isWithinMarketFetchTtl", () => {
  it("returns false when never fetched", () => {
    expect(isWithinMarketFetchTtl(undefined, 100_000)).toBe(false);
  });

  it("returns true inside the TTL window", () => {
    const now = 200_000;
    expect(
      isWithinMarketFetchTtl(now - MARKET_FETCH_TTL_MS + 1, now),
    ).toBe(true);
  });

  it("returns false at or past the TTL window", () => {
    const now = 200_000;
    expect(isWithinMarketFetchTtl(now - MARKET_FETCH_TTL_MS, now)).toBe(false);
  });
});

describe("portfolioQuotesNeedNetworkFetch", () => {
  const equity: PortfolioPosition = {
    id: "1",
    kind: "equity",
    symbol: "AAPL",
    quantity: 1,
    exchange: "NASDAQ",
  };

  it("requires fetch when TTL expired", () => {
    const now = 1_000_000;
    expect(
      portfolioQuotesNeedNetworkFetch(
        [equity],
        { [positionQuoteKey(equity)]: {} as never },
        now - MARKET_FETCH_TTL_MS,
        now,
      ),
    ).toBe(true);
  });

  it("skips fetch when TTL fresh and keys covered", () => {
    const now = 1_000_000;
    expect(
      portfolioQuotesNeedNetworkFetch(
        [equity],
        { [positionQuoteKey(equity)]: {} as never },
        now - 1_000,
        now,
      ),
    ).toBe(false);
  });

  it("requires fetch when a market key is missing from cache", () => {
    const now = 1_000_000;
    expect(
      portfolioQuotesNeedNetworkFetch([equity], {}, now - 1_000, now),
    ).toBe(true);
  });
});
