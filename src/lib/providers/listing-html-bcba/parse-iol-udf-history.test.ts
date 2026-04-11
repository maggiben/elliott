import { describe, expect, it } from "vitest";
import { parseIolUdfHistoryJson } from "./parse-iol-udf-history";

describe("parseIolUdfHistoryJson", () => {
  it("maps ok bars to ascending ChartPoints using close", () => {
    const pts = parseIolUdfHistoryJson({
      status: "ok",
      bars: [
        { time: 200, close: "10.5" },
        { time: 100, close: 9 },
      ],
    });
    expect(pts).toEqual([
      { timeSec: 100, value: 9 },
      { timeSec: 200, value: 10.5 },
    ]);
  });

  it("returns [] for errors or missing bars", () => {
    expect(parseIolUdfHistoryJson({ status: "error" })).toEqual([]);
    expect(parseIolUdfHistoryJson({ status: "ok" })).toEqual([]);
    expect(parseIolUdfHistoryJson(null)).toEqual([]);
  });

  it("accepts no_data with empty bars", () => {
    expect(parseIolUdfHistoryJson({ status: "no_data", bars: [] })).toEqual([]);
  });
});
