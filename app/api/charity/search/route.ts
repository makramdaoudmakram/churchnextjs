import { NextRequest } from "next/server";
import { proxyCharityApi } from "@/lib/charity-proxy";

export async function POST(req: NextRequest) {
  const body = await req.text();
  return proxyCharityApi("/api/search", { method: "POST", body });
}
