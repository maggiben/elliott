import { fetchIolListingQuoteServer } from "@/lib/server/iol-fetch";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol")?.trim() ?? "";
  const exchange = req.nextUrl.searchParams.get("exchange")?.trim() ?? "";
  if (!symbol || !exchange) {
    return Response.json(
      { error: "symbol and exchange are required" },
      { status: 400 },
    );
  }
  const data = await fetchIolListingQuoteServer(symbol, exchange, req.signal);
  return Response.json({ data });
}
