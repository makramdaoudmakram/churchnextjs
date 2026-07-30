/** Production Charity API (IIS publish). */
export const PRODUCTION_CHARITY_API_URL = "https://eladra.aghapy-company.com";

/** Local Charity API (dotnet run — http profile). */
export const DEVELOPMENT_CHARITY_API_URL = "http://127.0.0.1:5173";

/**
 * Resolved backend URL for Next.js server routes, NextAuth, and rewrites.
 * Override with CHARITY_API_URL or NEXT_PUBLIC_CHARITY_API_URL in env files.
 */
export function resolveCharityApiUrl(): string {
  const fromEnv =
    process.env.CHARITY_API_URL?.trim() ||
    process.env.NEXT_PUBLIC_CHARITY_API_URL?.trim();

  if (fromEnv) return fromEnv.replace(/\/$/, "");

  return process.env.NODE_ENV === "production"
    ? PRODUCTION_CHARITY_API_URL
    : DEVELOPMENT_CHARITY_API_URL;
}

/** URLs to try when probing or logging in (dev only falls back to localhost). */
export function getCharityApiUrlCandidates(): string[] {
  const primary = resolveCharityApiUrl();
  if (process.env.NODE_ENV === "production") {
    return [primary];
  }
  return [...new Set([primary, DEVELOPMENT_CHARITY_API_URL, "http://localhost:5173"])];
}

export function isDevelopmentCharityApi(): boolean {
  return process.env.NODE_ENV !== "production";
}
