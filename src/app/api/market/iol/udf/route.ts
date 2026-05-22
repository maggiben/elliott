import { fetchIolUdfDailySeriesServer } from "@/lib/server/iol-fetch";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol")?.trim() ?? "";
  const exchange = req.nextUrl.searchParams.get("exchange")?.trim() ?? "";
  const daysRaw = req.nextUrl.searchParams.get("days")?.trim() ?? "";
  const days = Number(daysRaw);
  if (!symbol || !exchange || !Number.isFinite(days) || days < 1) {
    return Response.json(
      { error: "symbol, exchange, and days (positive number) are required" },
      { status: 400 },
    );
  }
  const points = await fetchIolUdfDailySeriesServer(
    symbol,
    exchange,
    Math.floor(days),
    req.signal,
  );
  return Response.json({ points });
}
