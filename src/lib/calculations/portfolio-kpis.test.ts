import { describe, expect, it } from "vitest";
import { computePortfolioKpis } from "./portfolio-kpis";
import type { MarketData } from "@/lib/market-data/types";
import type { PortfolioPosition } from "@/lib/portfolio/types";

function md(p: Partial<MarketData> & Pick<MarketData, "symbol" | "kind" | "price" | "currency" | "source">): MarketData {
  return {
    displayName: p.symbol,
    change24hPct: null,
    volume24h: null,
    high24h: null,
    low24h: null,
    lastUpdatedMs: 0,
    ...p,
  };
}

describe("computePortfolioKpis", () => {
  it("unifies ARS and USD into a single book when BTC-denominated rates are provided", () => {
    const positions: PortfolioPosition[] = [
      {
        id: "a",
        symbol: "USDC",
        quantity: 1,
        kind: "crypto",
      },
      {
        id: "b",
        symbol: "CAT",
        quantity: 1,
        kind: "equity",
        exchange: "BCBA",
      },
    ];
    const quotes: Record<string, MarketData | undefined> = {
      "crypto:USDC": md({
        symbol: "USDC",
        kind: "crypto",
        price: 100,
        currency: "USD",
        source: "coingecko",
      }),
      "equity:CAT:BCBA": md({
        symbol: "CAT",
        kind: "equity",
        price: 150_000,
        currency: "ARS",
        source: "listing_html",
      }),
    };
    // 1 BTC = 100 USD = 150_000 ARS → 1500 ARS per USD
    const rates = { usd: 100, ars: 150_000 };

    const kpis = computePortfolioKpis(positions, quotes, {
      displayCurrency: "USD",
      btcDenominatedRates: rates,
    });

    expect(kpis.hasMixedCurrencies).toBe(false);
    expect(kpis.totalValue).toBeCloseTo(200, 5);
    expect(kpis.allocation).toHaveLength(2);
    const bySym = Object.fromEntries(
      kpis.allocation.map((s) => [s.symbol, s.weight] as const),
    );
    expect(bySym.USDC).toBeCloseTo(0.5, 5);
    expect(bySym.CAT).toBeCloseTo(0.5, 5);
  });

  it("marks mixed currencies until FX rates are available", () => {
    const positions: PortfolioPosition[] = [
      {
        id: "a",
        symbol: "USDC",
        quantity: 1,
        kind: "crypto",
      },
      {
        id: "b",
        symbol: "CAT",
        quantity: 1,
        kind: "equity",
        exchange: "BCBA",
      },
    ];
    const quotes: Record<string, MarketData | undefined> = {
      "crypto:USDC": md({
        symbol: "USDC",
        kind: "crypto",
        price: 100,
        currency: "USD",
        source: "coingecko",
      }),
      "equity:CAT:BCBA": md({
        symbol: "CAT",
        kind: "equity",
        price: 150_000,
        currency: "ARS",
        source: "listing_html",
      }),
    };

    const kpis = computePortfolioKpis(positions, quotes, {
      displayCurrency: "USD",
    });

    expect(kpis.hasMixedCurrencies).toBe(true);
    expect(kpis.allocation.every((s) => s.weight === 0)).toBe(true);
  });

  it("unifies USD book into BTC when display is BTC and rates are provided", () => {
    const positions: PortfolioPosition[] = [
      {
        id: "a",
        symbol: "USDC",
        quantity: 2,
        kind: "crypto",
      },
    ];
    const quotes: Record<string, MarketData | undefined> = {
      "crypto:USDC": md({
        symbol: "USDC",
        kind: "crypto",
        price: 50_000,
        currency: "USD",
        source: "coingecko",
      }),
    };
    // 1 BTC = 100_000 USD → $100k notional = 1 BTC
    const rates = { usd: 100_000, btc: 1 };

    const kpis = computePortfolioKpis(positions, quotes, {
      displayCurrency: "BTC",
      btcDenominatedRates: rates,
    });

    expect(kpis.hasMixedCurrencies).toBe(false);
    expect(kpis.displayCurrency).toBe("BTC");
    expect(kpis.totalValue).toBeCloseTo(1, 5);
    expect(kpis.allocation[0]?.currency).toBe("BTC");
  });

  it("injects canonical btc=1 when the rate map omits btc (BTC book)", () => {
    const positions: PortfolioPosition[] = [
      {
        id: "a",
        symbol: "USDC",
        quantity: 1,
        kind: "crypto",
      },
    ];
    const quotes: Record<string, MarketData | undefined> = {
      "crypto:USDC": md({
        symbol: "USDC",
        kind: "crypto",
        price: 100_000,
        currency: "USD",
        source: "coingecko",
      }),
    };
    const rates = { usd: 100_000 };

    const kpis = computePortfolioKpis(positions, quotes, {
      displayCurrency: "BTC",
      btcDenominatedRates: rates,
    });

    expect(kpis.hasMixedCurrencies).toBe(false);
    expect(kpis.totalValue).toBeCloseTo(1, 5);
  });
});
