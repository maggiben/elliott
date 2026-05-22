import { afterEach, describe, expect, it, vi } from "vitest";
import * as corsfix from "./corsfix-fetch";
import { fetchRemoteHttps } from "./remote-fetch";

describe("fetchRemoteHttps", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns direct response when fetch succeeds with ok", async () => {
    const direct = new Response("ok", { status: 200 });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(direct));
    const corsfixSpy = vi.spyOn(corsfix, "fetchViaCorsfix");

    const res = await fetchRemoteHttps("https://example.com/page");
    expect(res).toBe(direct);
    expect(corsfixSpy).not.toHaveBeenCalled();
  });

  it("falls back to Corsfix when direct fetch is not ok", async () => {
    const bad = new Response("nope", { status: 403 });
    const proxied = new Response("<html>", { status: 200 });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(bad));
    vi.spyOn(corsfix, "fetchViaCorsfix").mockResolvedValueOnce(proxied);

    const res = await fetchRemoteHttps("https://iol.invertironline.com/x");
    expect(res).toBe(proxied);
  });

  it("falls back to Corsfix when direct fetch throws", async () => {
    const proxied = new Response("{}", { status: 200 });
    vi.stubGlobal("fetch", vi.fn().mockRejectedValueOnce(new Error("blocked")));
    vi.spyOn(corsfix, "fetchViaCorsfix").mockResolvedValueOnce(proxied);

    const res = await fetchRemoteHttps("https://iol.invertironline.com/x");
    expect(res).toBe(proxied);
  });
});
