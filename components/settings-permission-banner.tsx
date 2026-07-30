"use client";

import { useCharityWrite } from "@/hooks/use-charity-write";
import type { CharityResource } from "@/lib/charity-permissions";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";

type Props = {
  resource: CharityResource;
};

export function SettingsPermissionBanner({ resource }: Props) {
  const { canWrite, loading, writePermission } = useCharityWrite(resource);

  if (loading || canWrite) return null;

  return (
    <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
      <p>
        Your login token is missing <code className="text-xs">{writePermission}</code>. Log out and
        sign in again with an admin account (e.g. <strong>admin</strong> / <strong>Admin@123</strong>).
      </p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-2"
        onClick={() => void signOut({ callbackUrl: "/login?force=1", redirect: true })}
      >
        Sign out and log in again
      </Button>
    </div>
  );
}
