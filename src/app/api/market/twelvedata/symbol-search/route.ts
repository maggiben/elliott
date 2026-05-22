import { twelveDataSymbolSearch } from "@/lib/server/twelvedata";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("query")?.trim() ?? "";
  if (!query) {
    return Response.json({ hits: [] });
  }
  const hits = await twelveDataSymbolSearch(query, req.signal);
  return Response.json({ hits });
}
