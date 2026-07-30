/** Read `permission` claims from a Charity API JWT (source of truth for API calls). */
export function permissionsFromAccessToken(accessToken: string | undefined | null): string[] {
  if (!accessToken) return [];
  const parts = accessToken.split(".");
  if (parts.length < 2) return [];

  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const json = JSON.parse(
      typeof atob !== "undefined"
        ? atob(padded)
        : Buffer.from(padded, "base64").toString("utf8")
    ) as Record<string, unknown>;

    const raw = json.permission ?? json.Permission;
    if (Array.isArray(raw)) {
      return [...new Set(raw.filter((v): v is string => typeof v === "string"))];
    }
    if (typeof raw === "string") return [raw];
    return [];
  } catch {
    return [];
  }
}

const ROLE_CLAIM_KEYS = [
  "role",
  "roles",
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role",
];

/** Read role claims from a Charity API JWT. */
export function rolesFromAccessToken(accessToken: string | undefined | null): string[] {
  if (!accessToken) return [];
  const parts = accessToken.split(".");
  if (parts.length < 2) return [];

  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const json = JSON.parse(
      typeof atob !== "undefined"
        ? atob(padded)
        : Buffer.from(padded, "base64").toString("utf8")
    ) as Record<string, unknown>;

    const roles: string[] = [];
    for (const key of ROLE_CLAIM_KEYS) {
      const raw = json[key];
      if (Array.isArray(raw)) {
        roles.push(...raw.filter((v): v is string => typeof v === "string"));
      } else if (typeof raw === "string") {
        roles.push(raw);
      }
    }
    return [...new Set(roles)];
  } catch {
    return [];
  }
}

export function normalizeLoginPayload(data: Record<string, unknown>) {
  const token =
    (typeof data.token === "string" && data.token) ||
    (typeof data.Token === "string" && data.Token) ||
    "";
  const rolesRaw = data.roles ?? data.Roles;
  const permsRaw = data.permissions ?? data.Permissions;
  let roles = Array.isArray(rolesRaw)
    ? rolesRaw.filter((v): v is string => typeof v === "string")
    : [];
  let permissions = Array.isArray(permsRaw)
    ? permsRaw.filter((v): v is string => typeof v === "string")
    : [];
  if (permissions.length === 0 && token) {
    permissions = permissionsFromAccessToken(token);
  }
  if (roles.length === 0 && token) {
    roles = rolesFromAccessToken(token);
  }
  const userName =
    (typeof data.userName === "string" && data.userName) ||
    (typeof data.UserName === "string" && data.UserName) ||
    "";
  return { token, roles, permissions, userName };
}
