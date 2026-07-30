import { NextRequest } from "next/server";
import { proxyCharityApi } from "@/lib/charity-proxy";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.toString();
  return proxyCharityApi(`/api/family-members${query ? `?${query}` : ""}`);
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  return proxyCharityApi("/api/family-members", { method: "POST", body });
}
