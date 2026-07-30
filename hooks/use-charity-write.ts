"use client";

import { useSession } from "next-auth/react";
import {
  canWriteCharityResource,
  CHARITY_WRITE_PERMISSION,
  type CharityResource,
} from "@/lib/charity-permissions";
import { permissionsFromAccessToken, rolesFromAccessToken } from "@/lib/jwt-permissions";

function mergePermissions(session: ReturnType<typeof useSession>["data"]) {
  const fromSession = session?.user?.permissions ?? session?.permissions ?? [];
  const fromJwt = permissionsFromAccessToken(session?.accessToken);
  return fromJwt.length > 0 ? fromJwt : fromSession;
}

function mergeRoles(session: ReturnType<typeof useSession>["data"]) {
  const fromSession = session?.user?.roles ?? session?.roles ?? [];
  const fromJwt = rolesFromAccessToken(session?.accessToken);
  return fromJwt.length > 0 ? fromJwt : fromSession;
}

/**
 * Use on every settings CRUD page. Pass the resource that matches the Charity API controller group.
 */
export function useCharityWrite(resource: CharityResource) {
  const { data: session, status } = useSession();
  const permissions = mergePermissions(session);
  const roles = mergeRoles(session);
  const writePermission = CHARITY_WRITE_PERMISSION[resource];

  const canWrite =
    status === "authenticated" && canWriteCharityResource(roles, permissions, resource);

  return {
    canWrite,
    loading: status === "loading",
    writePermission,
    permissions,
    roles,
  };
}
