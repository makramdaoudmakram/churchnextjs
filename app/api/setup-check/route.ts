import { isAuthConfigured } from "@/lib/auth-config";
import { resolveCharityApiUrl } from "@/lib/charity-api-config";
import { NextResponse } from "next/server";

/** GET /api/setup-check — safe env diagnostics for Vercel (no secret values). */
export async function GET() {
  return NextResponse.json({
    ok: isAuthConfigured(),
    authSecretSet: isAuthConfigured(),
    authUrlSet: !!(process.env.AUTH_URL?.trim() || process.env.NEXTAUTH_URL?.trim()),
    charityApiUrl: resolveCharityApiUrl(),
    nodeEnv: process.env.NODE_ENV,
    message: isAuthConfigured()
      ? "Auth is configured."
      : "AUTH_SECRET is missing or too short (need 32+ chars) on Vercel.",
  });
}
