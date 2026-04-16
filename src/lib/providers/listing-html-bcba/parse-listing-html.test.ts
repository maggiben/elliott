import { describe, expect, it } from "vitest";
import { parseListingHtmlQuote } from "./parse-listing-html";

describe("parseListingHtmlQuote", () => {
  it("parses NYSE-style IOL cells (comma decimal, bare Ultimo → USD)", () => {
    const html = `
      <h1 class="header-title">Global X Uranium Etf <small>URA</small></h1>
      <td data-field="UltimoPrecio">54,837</td>
      <td data-field="Variacion" class="tar">3,78</td>
      <td data-field="VolumenNominal">US$ 2.998.651,67 Q: 4568578</td>
      <td data-field="MontoOperado">US$ 2.998.651,67</td>
      <td data-field="Maximo">Max: US$ 55,47</td>
      <td data-field="Minimo">Min: US$ 53,32</td>
    `;
    const q = parseListingHtmlQuote(html, "URA", "NYSE");
    expect(q).not.toBeNull();
    expect(q!.symbol).toBe("URA");
    expect(q!.price).toBeCloseTo(54.837, 5);
    expect(q!.currency).toBe("USD");
    expect(q!.changeDayPct).toBeCloseTo(3.78, 5);
    expect(q!.volumeNominal).toBe(4_568_578);
    expect(q!.highDay).toBeCloseTo(55.47, 5);
    expect(q!.lowDay).toBeCloseTo(53.32, 5);
  });

  it("parses NASDAQ-style IOL with venue-based USD when Ultimo has no currency prefix", () => {
    const html = `
      <h1 class="header-title">Invesco QQQ <small>QQQ</small></h1>
      <td data-field="UltimoPrecio">637,42</td>
      <td data-field="Variacion" class="tar">1,40</td>
    `;
    const q = parseListingHtmlQuote(html, "QQQ", "NASDAQ");
    expect(q).not.toBeNull();
    expect(q!.currency).toBe("USD");
    expect(q!.price).toBeCloseTo(637.42, 5);
  });
});
