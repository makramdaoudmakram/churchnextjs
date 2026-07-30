import type { CharityResource } from "@/lib/charity-permissions";

/**
 * Checklist for new Charity dashboard CRUD pages (follow every item):
 *
 * API
 * - Controller route api/<resource> with LookupsRead/Write or ChurchesRead/Write etc.
 * - POST uses OkCreated(id, message) — never bare Created({ id }) without success envelope.
 * - Delete: check FK children and return a clear Result.Failure message.
 *
 * Next.js
 * - app/api/charity/<path>/route.ts + [id]/route.ts → proxyCharityApi
 * - lib/<name>-api.ts → charityClientGet / charityClientSend
 * - lib/charity-permissions.ts → add path in charityResourceFromApiPath if new prefix
 * - Page client: useCharityWrite("<resource>"), SettingsPermissionBanner, apiErrorMessage, normalizeRowVersion on edit
 *
 * Resources: lookups (geo incl. streets), churches (churches + fathers), applicants, addresses
 */
export const NEW_CHARITY_PAGE_CHECKLIST = true satisfies boolean;

export type { CharityResource };
