/**
 * Central permission model for Charity dashboard CRUD pages.
 * When adding a new settings page, set `resource` in useCharityWrite() — do not hard-code permission strings in the page.
 */

export type CharityResource = "lookups" | "churches" | "applicants" | "addresses";

export const CHARITY_WRITE_PERMISSION: Record<CharityResource, string> = {
  lookups: "lookups.write",
  churches: "churches.write",
  applicants: "applicants.write",
  addresses: "addresses.write",
};

export const CHARITY_READ_PERMISSION: Record<CharityResource, string> = {
  lookups: "lookups.read",
  churches: "churches.read",
  applicants: "applicants.read",
  addresses: "addresses.read",
};

/** Roles that receive all dashboard write permissions from the API seeder (except users.manage). */
export const DASHBOARD_STAFF_ROLES = ["Admin", "CharityOfficer", "Viewer"] as const;

export function permissionHintForCharityPath(apiPath: string, method: string): string {
  const m = method.toUpperCase();
  const isRead = m === "GET" || m === "HEAD";
  const resource = charityResourceFromApiPath(apiPath);
  if (resource) {
    return isRead ? CHARITY_READ_PERMISSION[resource] : CHARITY_WRITE_PERMISSION[resource];
  }
  return isRead ? "read permission for this resource" : "write permission for this resource";
}

/** Maps Charity API path segments to a resource (used by proxy + new pages). */
export function charityResourceFromApiPath(apiPath: string): CharityResource | null {
  const p = apiPath.toLowerCase();
  if (
    p.includes("/governorates") ||
    p.includes("/cities") ||
    p.includes("/areas") ||
    p.includes("/streets") ||
    p.includes("/lookups") ||
    p.includes("/education-levels") ||
    p.includes("/job-titles") ||
    p.includes("/marital-statuses") ||
    p.includes("/supervisors") ||
    p.includes("/geo/")
  ) {
    return "lookups";
  }
  if (p.includes("/churches") || p.includes("/fathers-of-confession")) {
    return "churches";
  }
  if (p.includes("/applicants") || p.includes("/family-members") || p.includes("/income-sources")) {
    return "applicants";
  }
  if (p.includes("/addresses")) {
    return "addresses";
  }
  if (p.includes("/search")) {
    return "applicants";
  }
  return null;
}

export function hasCharityPermission(permissions: string[] | undefined, permission: string): boolean {
  return permissions?.includes(permission) === true;
}

export function isDashboardStaffRole(roles: string[] | undefined): boolean {
  if (!roles?.length) return false;
  return roles.some((r) => (DASHBOARD_STAFF_ROLES as readonly string[]).includes(r));
}

export function canWriteCharityResource(
  roles: string[] | undefined,
  permissions: string[] | undefined,
  resource: CharityResource
): boolean {
  if (isDashboardStaffRole(roles)) return true;
  return hasCharityPermission(permissions, CHARITY_WRITE_PERMISSION[resource]);
}
