"use client";

import { useCharityWrite } from "@/hooks/use-charity-write";
import type { CharityResource } from "@/lib/charity-permissions";

type Props = {
  resource: CharityResource;
};

export function SettingsPermissionBanner({ resource }: Props) {
  const { canWrite, loading, writePermission } = useCharityWrite(resource);

  if (loading || canWrite) return null;

  return (
    <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
      Your login token is missing <code className="text-xs">{writePermission}</code>. Stop and restart
      the Charity API, then <strong>log out and sign in again</strong>. Admin users always have access
      after a fresh login.
    </p>
  );
}
