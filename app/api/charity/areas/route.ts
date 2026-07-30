import { NextRequest } from "next/server";
import { proxyCharityApi } from "@/lib/charity-proxy";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.toString();
  return proxyCharityApi(`/api/areas${query ? `?${query}` : ""}`);
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  return proxyCharityApi("/api/areas", { method: "POST", body });
}
