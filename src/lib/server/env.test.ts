import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { corsfixApiKey, twelvedataApiKey } from "./env";

describe("server env", () => {
  const keys = [
    "TWELVEDATA_API_KEY",
    "CORSFIX_API_KEY",
  ] as const;
  const prev: Record<string, string | undefined> = {};

  afterEach(() => {
    for (const k of keys) {
      if (prev[k] === undefined) delete process.env[k];
      else process.env[k] = prev[k];
    }
  });

  beforeEach(() => {
    for (const k of keys) prev[k] = process.env[k];
  });

  it("uses TWELVEDATA_API_KEY when set", () => {
    process.env.TWELVEDATA_API_KEY = "server-key";
    expect(twelvedataApiKey()).toBe("server-key");
  });

  it("defaults TwelveData to demo when unset", () => {
    delete process.env.TWELVEDATA_API_KEY;
    expect(twelvedataApiKey()).toBe("demo");
  });

  it("uses CORSFIX_API_KEY when set", () => {
    process.env.CORSFIX_API_KEY = "cfx_server";
    expect(corsfixApiKey()).toBe("cfx_server");
  });

  it("returns undefined for Corsfix when unset", () => {
    delete process.env.CORSFIX_API_KEY;
    expect(corsfixApiKey()).toBeUndefined();
  });
});
