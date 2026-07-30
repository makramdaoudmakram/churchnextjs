import { NextResponse } from "next/server";
import { getCharityApiUrlCandidates } from "@/lib/charity-api-config";

async function probe(base: string) {
  const paths = ["/api/health", "/swagger/index.html"];
  for (const path of paths) {
    try {
      const res = await fetch(`${base}${path}`, {
        method: "GET",
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
      });
      if (res.ok) return { ok: true as const, path };
    } catch {
      /* try next */
    }
  }
  return { ok: false as const };
}

/** GET /api/charity/health — can Next.js reach the .NET API? */
export async function GET() {
  const tried: { url: string; ok: boolean; path?: string; error?: string }[] = [];

  for (const base of getCharityApiUrlCandidates()) {
    try {
      const result = await probe(base);
      if (result.ok) {
        tried.push({ url: base, ok: true, path: result.path });
        return NextResponse.json({
          ok: true,
          backend: base,
          message: "Charity API is reachable. You can register and log in.",
          tried,
        });
      }
      tried.push({ url: base, ok: false });
    } catch (e) {
      tried.push({ url: base, ok: false, error: e instanceof Error ? e.message : String(e) });
    }
  }

  const isDev = process.env.NODE_ENV !== "production";

  return NextResponse.json(
    {
      ok: false,
      message: isDev
        ? "Charity API is NOT running. Start it first (see instructions below)."
        : "Charity API is not reachable in production. Check https://eladra.aghapy-company.com and CHARITY_API_URL.",
      tried,
      startCommand: isDev
        ? "cd D:\\church\\churchapi && dotnet run --project src\\Charity.Api --launch-profile http"
        : undefined,
    },
    { status: 503 }
  );
}
