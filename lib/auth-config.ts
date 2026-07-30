/** NextAuth / Auth.js secret — required on Vercel (AUTH_SECRET). */
export function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim();
  if (secret) return secret;

  if (process.env.NODE_ENV === "development") {
    return "local-dev-secret-minimum-32-characters-long";
  }

  return "";
}

export function isAuthConfigured(): boolean {
  return getAuthSecret().length >= 32;
}
