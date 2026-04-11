import { describe, expect, it } from "vitest";
import { fixedIncomeAccruedMultiplier } from "./fixed-income-accrual";

describe("fixedIncomeAccruedMultiplier", () => {
  it("returns 1 before the accrual start", () => {
    expect(
      fixedIncomeAccruedMultiplier({
        annualRatePct: 40,
        startDate: "2030-06-01",
        maturityDate: "2030-12-01",
        nowMs: Date.UTC(2026, 0, 1),
      }),
    ).toBe(1);
  });

  it("accrues with simple interest by calendar days", () => {
    const m = fixedIncomeAccruedMultiplier({
      annualRatePct: 365,
      startDate: "2024-01-01",
      maturityDate: "2024-02-01",
      nowMs: Date.UTC(2024, 0, 6),
    });
    expect(m).toBeCloseTo(1.05, 5);
  });

  it("stops adding interest after maturity", () => {
    const atMat = fixedIncomeAccruedMultiplier({
      annualRatePct: 100,
      startDate: "2024-01-01",
      maturityDate: "2024-01-31",
      nowMs: Date.UTC(2024, 0, 31),
    });
    const later = fixedIncomeAccruedMultiplier({
      annualRatePct: 100,
      startDate: "2024-01-01",
      maturityDate: "2024-01-31",
      nowMs: Date.UTC(2025, 0, 1),
    });
    expect(atMat).toBeCloseTo(later!, 8);
    expect(atMat).toBeCloseTo(1 + 30 / 365, 5);
  });

  it("rejects maturity before start", () => {
    expect(
      fixedIncomeAccruedMultiplier({
        annualRatePct: 10,
        startDate: "2024-12-01",
        maturityDate: "2024-01-01",
        nowMs: Date.UTC(2024, 6, 1),
      }),
    ).toBeNull();
  });
});
