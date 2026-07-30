function normalizeEnv(value: string | undefined): string {
  if (!value) return "";
  let v = value.trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1).trim();
  }
  return v;
}

/** NextAuth / Auth.js secret — required on Vercel (AUTH_SECRET). */
export function getAuthSecret(): string {
  const secret =
    normalizeEnv(process.env.AUTH_SECRET) || normalizeEnv(process.env.NEXTAUTH_SECRET);
  if (secret) return secret;

  if (process.env.NODE_ENV === "development") {
    return "local-dev-secret-minimum-32-characters-long";
  }

  return "";
}

/** Public site URL for Auth.js (Vercel sets VERCEL_URL automatically). */
export function getAuthUrl(): string {
  const fromEnv =
    normalizeEnv(process.env.AUTH_URL) || normalizeEnv(process.env.NEXTAUTH_URL);
  if (fromEnv) return fromEnv.replace(/\/$/, "");

  const vercel = normalizeEnv(process.env.VERCEL_URL);
  if (vercel) {
    return vercel.startsWith("http") ? vercel.replace(/\/$/, "") : `https://${vercel}`;
  }

  return "";
}

export function isAuthConfigured(): boolean {
  return getAuthSecret().length >= 32;
}

/** Safe diagnostics — lengths only, never secret values. */
export function getAuthEnvDiagnostics() {
  return {
    hasAuthSecretKey: typeof process.env.AUTH_SECRET === "string",
    authSecretLength: process.env.AUTH_SECRET?.length ?? 0,
    hasNextAuthSecretKey: typeof process.env.NEXTAUTH_SECRET === "string",
    nextAuthSecretLength: process.env.NEXTAUTH_SECRET?.length ?? 0,
    effectiveSecretLength: getAuthSecret().length,
    hasAuthUrlKey: typeof process.env.AUTH_URL === "string",
    hasNextAuthUrlKey: typeof process.env.NEXTAUTH_URL === "string",
    vercelUrl: process.env.VERCEL_URL ?? null,
    resolvedAuthUrl: getAuthUrl() || null,
  };
}
