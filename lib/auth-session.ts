import type { Session } from "next-auth";

type AuthSession = Session & {
  accessToken?: string;
  jwt?: string;
  user?: Session["user"] & {
    roles?: string[];
    permissions?: string[];
  };
};

/** True only when NextAuth session includes a Charity API JWT. */
export function hasValidCharitySession(auth: AuthSession | null | undefined): boolean {
  if (!auth?.user) return false;
  const token = auth.accessToken ?? auth.jwt;
  return typeof token === "string" && token.length > 0;
}

export function getSessionAccessToken(auth: AuthSession | null | undefined): string | undefined {
  if (!auth) return undefined;
  const token = auth.accessToken ?? auth.jwt;
  return typeof token === "string" && token.length > 0 ? token : undefined;
}
