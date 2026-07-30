import { charityClientGet, charityClientSend } from "@/lib/charity-client";

export type LookupTypeName =
  | "EducationLevel"
  | "JobTitle"
  | "MaritalStatus"
  | "RelationshipType";

export type PagedResult<T> = {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
};

export type LookupListItem = {
  id: number;
  name: string;
  description?: string | null;
  isActive: boolean;
};

export type LookupDetails = LookupListItem & { rowVersion: string };

export function listLookups(type: LookupTypeName, params: { pageNumber: number; pageSize: number }) {
  const qs = new URLSearchParams({
    pageNumber: String(params.pageNumber),
    pageSize: String(params.pageSize),
  });
  return charityClientGet<PagedResult<LookupListItem>>(`/api/charity/lookups/${type}?${qs}`);
}

export function getLookup(type: LookupTypeName, id: number) {
  return charityClientGet<LookupDetails>(`/api/charity/lookups/${type}/${id}`);
}

export function createLookup(type: LookupTypeName, body: { name: string; description?: string | null; isActive?: boolean }) {
  return charityClientSend<{ id: number }>(`/api/charity/lookups/${type}`, "POST", body);
}

export function updateLookup(type: LookupTypeName, id: number, body: Record<string, unknown>) {
  return charityClientSend<unknown>(`/api/charity/lookups/${type}/${id}`, "PUT", body);
}

export function deleteLookup(type: LookupTypeName, id: number) {
  return charityClientSend<unknown>(`/api/charity/lookups/${type}/${id}`, "DELETE");
}

export function listLookupsForSelect(type: LookupTypeName, pageSize = 200) {
  const qs = new URLSearchParams({ pageNumber: "1", pageSize: String(pageSize) });
  return charityClientGet<PagedResult<LookupListItem>>(`/api/charity/lookups/${type}?${qs}`);
}
