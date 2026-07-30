import { NextRequest } from "next/server";
import { proxyCharityApi } from "@/lib/charity-proxy";

type RouteContext = { params: Promise<{ type: string; id: string }> };

export async function GET(_req: NextRequest, context: RouteContext) {
  const { type, id } = await context.params;
  return proxyCharityApi(`/api/lookups/${type}/${id}`);
}

export async function PUT(req: NextRequest, context: RouteContext) {
  const { type, id } = await context.params;
  const body = await req.text();
  return proxyCharityApi(`/api/lookups/${type}/${id}`, { method: "PUT", body });
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  const { type, id } = await context.params;
  return proxyCharityApi(`/api/lookups/${type}/${id}`, { method: "DELETE" });
}
