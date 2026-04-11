import { describe, expect, it } from "vitest";
import { corsfixProxyUrl } from "./corsfix";

describe("corsfixProxyUrl", () => {
  it("embeds target as raw https://… query (Corsfix GET form, not percent-encoded)", () => {
    const target =
      "https://iol.invertironline.com/titulo/cotizacion/BCBA/YPFD";
    expect(corsfixProxyUrl(target)).toBe(`https://proxy.corsfix.com/?${target}`);
    expect(corsfixProxyUrl(target)).not.toMatch(/https%3A/i);
  });

  it("uses url= when target contains & or # (ambiguous in naked query form)", () => {
    const withAmp = "https://example.com/path?a=1&b=2";
    expect(corsfixProxyUrl(withAmp)).toBe(
      `https://proxy.corsfix.com/?url=${encodeURIComponent(withAmp)}`,
    );
    const withHash = "https://example.com/page#frag";
    expect(corsfixProxyUrl(withHash)).toBe(
      `https://proxy.corsfix.com/?url=${encodeURIComponent(withHash)}`,
    );
  });
});
