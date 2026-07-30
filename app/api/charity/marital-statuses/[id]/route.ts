import { NextRequest } from "next/server";
import { proxyCharityApi } from "@/lib/charity-proxy";
import { lookupResourceApiBase } from "@/lib/lookup-resource-proxy";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  return proxyCharityApi(`${lookupResourceApiBase("marital-statuses")}/${id}`);
}

export async function PUT(req: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const body = await req.text();
  return proxyCharityApi(`${lookupResourceApiBase("marital-statuses")}/${id}`, { method: "PUT", body });
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  return proxyCharityApi(`${lookupResourceApiBase("marital-statuses")}/${id}`, { method: "DELETE" });
}
