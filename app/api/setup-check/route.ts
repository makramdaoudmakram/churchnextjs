import { getAuthEnvDiagnostics, getAuthUrl, isAuthConfigured } from "@/lib/auth-config";
import { resolveCharityApiUrl } from "@/lib/charity-api-config";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** GET /api/setup-check — safe env diagnostics for Vercel (no secret values). */
export async function GET() {
  const diagnostics = getAuthEnvDiagnostics();
  const authOk = isAuthConfigured();
  const authUrlOk = getAuthUrl().length > 0;

  let message = "Auth is configured.";
  if (!authOk) {
    if (!diagnostics.hasAuthSecretKey && !diagnostics.hasNextAuthSecretKey) {
      message =
        "AUTH_SECRET is not visible to the server. In Vercel → Settings → Environment Variables, add AUTH_SECRET, check Production, then Redeploy (clear cache).";
    } else if (diagnostics.effectiveSecretLength < 32) {
      message = `AUTH_SECRET is too short (${diagnostics.effectiveSecretLength} chars). Use at least 32 characters. Do not wrap the value in quotes.`;
    } else {
      message = "AUTH_SECRET could not be read. Redeploy after saving environment variables.";
    }
  }

  return NextResponse.json({
    ok: authOk && authUrlOk,
    authSecretSet: authOk,
    authUrlSet: authUrlOk,
    charityApiUrl: resolveCharityApiUrl(),
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV ?? null,
    diagnostics,
    message,
  });
}
