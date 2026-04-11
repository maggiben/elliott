import { describe, expect, it } from "vitest";
import {
  convertAmountViaBtcBridge,
  portfolioNeedsFxUnification,
} from "./fx-via-btc";

describe("convertAmountViaBtcBridge", () => {
  it("returns the same amount when currencies match", () => {
    const rates = { usd: 100, ars: 100_000 };
    expect(convertAmountViaBtcBridge(50, "USD", "USD", rates)).toBe(50);
  });

  it("converts ARS to USD using BTC-denominated rates", () => {
    // 1 BTC = 100 USD = 100,000 ARS → 1 ARS = 0.001 USD
    const rates = { usd: 100, ars: 100_000 };
    const usd = convertAmountViaBtcBridge(50_000, "ARS", "USD", rates);
    expect(usd).toBeCloseTo(50, 5);
  });

  it("converts USD to ARS symmetrically", () => {
    const rates = { usd: 100, ars: 100_000 };
    const ars = convertAmountViaBtcBridge(50, "USD", "ARS", rates);
    expect(ars).toBeCloseTo(50_000, 5);
  });

  it("converts USD to BTC using BTC-denominated rates", () => {
    // 1 BTC = 100_000 USD → $50_000 = 0.5 BTC
    const rates = { usd: 100_000, btc: 1 };
    const btc = convertAmountViaBtcBridge(50_000, "USD", "BTC", rates);
    expect(btc).toBeCloseTo(0.5, 5);
  });

  it("returns null when a leg is missing from the rate map", () => {
    const rates = { usd: 100 };
    expect(convertAmountViaBtcBridge(1, "ARS", "USD", rates)).toBeNull();
  });
});

describe("portfolioNeedsFxUnification", () => {
  it("is false when quotes and display are USD and cost is absent", () => {
    expect(
      portfolioNeedsFxUnification({
        quoteCurrencies: ["USD"],
        displayCurrency: "USD",
        hasUsdCostBasis: false,
      }),
    ).toBe(false);
  });

  it("is true when quote currencies differ from display", () => {
    expect(
      portfolioNeedsFxUnification({
        quoteCurrencies: ["USD", "ARS"],
        displayCurrency: "USD",
        hasUsdCostBasis: false,
      }),
    ).toBe(true);
  });

  it("is true when display is not USD but cost basis is stored in USD", () => {
    expect(
      portfolioNeedsFxUnification({
        quoteCurrencies: ["ARS"],
        displayCurrency: "ARS",
        hasUsdCostBasis: true,
      }),
    ).toBe(true);
  });

  it("is true when book is BTC but quotes are in fiat", () => {
    expect(
      portfolioNeedsFxUnification({
        quoteCurrencies: ["USD"],
        displayCurrency: "BTC",
        hasUsdCostBasis: false,
      }),
    ).toBe(true);
  });
});
