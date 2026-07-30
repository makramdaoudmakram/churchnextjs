import { NextRequest } from "next/server";
import { proxyCharityApi } from "@/lib/charity-proxy";

type Params = { applicationId: string; fieldId: string };

export async function GET(req: NextRequest, ctx: { params: Promise<Params> }) {
  const { applicationId, fieldId } = await ctx.params;
  const query = req.nextUrl.searchParams.toString();
  return proxyCharityApi(
    `/api/search/applications/${applicationId}/fields/${fieldId}/lookup${query ? `?${query}` : ""}`
  );
}
