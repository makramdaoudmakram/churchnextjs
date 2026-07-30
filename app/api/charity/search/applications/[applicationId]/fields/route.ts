import { proxyCharityApi } from "@/lib/charity-proxy";

type Params = { applicationId: string };

export async function GET(_req: Request, ctx: { params: Promise<Params> }) {
  const { applicationId } = await ctx.params;
  return proxyCharityApi(`/api/search/applications/${applicationId}/fields`);
}
