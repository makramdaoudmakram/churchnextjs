import { NextRequest } from "next/server";
import { proxyCharityApi } from "@/lib/charity-proxy";

type RouteContext = { params: Promise<{ type: string }> };

export async function GET(req: NextRequest, context: RouteContext) {
  const { type } = await context.params;
  const query = req.nextUrl.searchParams.toString();
  return proxyCharityApi(`/api/lookups/${type}${query ? `?${query}` : ""}`);
}

export async function POST(req: NextRequest, context: RouteContext) {
  const { type } = await context.params;
  const body = await req.text();
  return proxyCharityApi(`/api/lookups/${type}`, { method: "POST", body });
}
