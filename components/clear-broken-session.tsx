"use client";

import { useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import { getSessionAccessToken } from "@/lib/auth-session";

/** Clears stale NextAuth cookies that have a user but no Charity API token. */
export function ClearBrokenSession() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status !== "authenticated") return;
    if (getSessionAccessToken(session)) return;
    void signOut({ redirect: false });
  }, [session, status]);

  return null;
}
