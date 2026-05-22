import { fetchTwelveDataPrice } from "@/lib/server/twelvedata";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol")?.trim() ?? "";
  if (!symbol) {
    return Response.json({ error: "symbol is required" }, { status: 400 });
  }
  const exchange = req.nextUrl.searchParams.get("exchange")?.trim() || undefined;
  const data = await fetchTwelveDataPrice(symbol, req.signal, exchange);
  return Response.json({ data });
}
