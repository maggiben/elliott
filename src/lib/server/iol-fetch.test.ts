import { afterEach, describe, expect, it, vi } from "vitest";
import * as remote from "./remote-fetch";
import { fetchIolListingQuoteServer } from "./iol-fetch";

const NYSE_HTML = `
  <h1 class="header-title">Global X Uranium Etf <small>URA</small></h1>
  <td data-field="UltimoPrecio">54,837</td>
  <td data-field="Variacion" class="tar">3,78</td>
`;

describe("fetchIolListingQuoteServer", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("parses listing HTML from remote fetch", async () => {
    vi.spyOn(remote, "fetchRemoteHttps").mockResolvedValueOnce(
      new Response(NYSE_HTML, { status: 200 }),
    );
    const q = await fetchIolListingQuoteServer("URA", "NYSE");
    expect(q).not.toBeNull();
    expect(q!.symbol).toBe("URA");
    expect(q!.price).toBeCloseTo(54.837, 5);
    expect(q!.source).toBe("listing_html");
  });

  it("returns null for non-IOL-preferred exchange", async () => {
    const spy = vi.spyOn(remote, "fetchRemoteHttps");
    const q = await fetchIolListingQuoteServer("BTC", "BINANCE");
    expect(q).toBeNull();
    expect(spy).not.toHaveBeenCalled();
  });
});
