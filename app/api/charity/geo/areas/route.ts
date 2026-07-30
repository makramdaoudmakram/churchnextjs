import { NextRequest } from "next/server";
import { proxyCharityApi } from "@/lib/charity-proxy";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.toString();
  return proxyCharityApi(`/api/geo/areas${query ? `?${query}` : ""}`);
}
