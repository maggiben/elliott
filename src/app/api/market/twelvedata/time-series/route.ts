import { fetchTwelveDataTimeSeries } from "@/lib/server/twelvedata";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol")?.trim() ?? "";
  const outputsizeRaw = req.nextUrl.searchParams.get("outputsize")?.trim() ?? "";
  const outputsize = Number(outputsizeRaw);
  if (!symbol || !Number.isFinite(outputsize) || outputsize < 1) {
    return Response.json(
      { error: "symbol and outputsize (positive number) are required" },
      { status: 400 },
    );
  }
  const exchange = req.nextUrl.searchParams.get("exchange")?.trim() || undefined;
  const points = await fetchTwelveDataTimeSeries(
    symbol,
    Math.floor(outputsize),
    req.signal,
    exchange,
  );
  return Response.json({ points });
}
