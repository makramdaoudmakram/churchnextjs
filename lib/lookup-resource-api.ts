import { charityClientGet, charityClientSend } from "@/lib/charity-client";
import type { LookupDetails, LookupListItem, PagedResult } from "@/lib/lookups-api";

export type LookupResourcePath = "education-levels" | "job-titles" | "marital-statuses";

export function listLookupResource(
  resource: LookupResourcePath,
  params: { pageNumber: number; pageSize: number }
) {
  const qs = new URLSearchParams({
    pageNumber: String(params.pageNumber),
    pageSize: String(params.pageSize),
  });
  return charityClientGet<PagedResult<LookupListItem>>(`/api/charity/${resource}?${qs}`);
}

export function getLookupResource(resource: LookupResourcePath, id: number) {
  return charityClientGet<LookupDetails>(`/api/charity/${resource}/${id}`);
}

export function createLookupResource(
  resource: LookupResourcePath,
  body: { name: string; description?: string | null; isActive?: boolean }
) {
  return charityClientSend<{ id: number }>(`/api/charity/${resource}`, "POST", body);
}

export function updateLookupResource(resource: LookupResourcePath, id: number, body: Record<string, unknown>) {
  return charityClientSend<unknown>(`/api/charity/${resource}/${id}`, "PUT", body);
}

export function deleteLookupResource(resource: LookupResourcePath, id: number) {
  return charityClientSend<unknown>(`/api/charity/${resource}/${id}`, "DELETE");
}

export function listLookupResourceForSelect(resource: LookupResourcePath, pageSize = 200) {
  return listLookupResource(resource, { pageNumber: 1, pageSize });
}
