"use client";

import { signOut } from "next-auth/react";
import { useEffect } from "react";

export default function LogoutPage() {
  useEffect(() => {
    void signOut({ callbackUrl: "/login", redirect: true });
  }, []);

  return (
    <div className="flex min-h-svh items-center justify-center p-6 text-sm text-muted-foreground">
      Signing out…
    </div>
  );
}
