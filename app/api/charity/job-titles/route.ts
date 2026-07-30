import { NextRequest } from "next/server";

import { proxyCharityApi } from "@/lib/charity-proxy";

import { lookupResourceApiBase } from "@/lib/lookup-resource-proxy";



export async function GET(req: NextRequest) {

  const query = req.nextUrl.searchParams.toString();

  const base = lookupResourceApiBase("job-titles");

  return proxyCharityApi(`${base}${query ? `?${query}` : ""}`);

}



export async function POST(req: NextRequest) {

  const body = await req.text();

  return proxyCharityApi(lookupResourceApiBase("job-titles"), { method: "POST", body });

}


