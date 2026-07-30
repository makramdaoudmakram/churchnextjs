import type { ApiResponse } from "@/lib/charity-api-types";
import { charityClientGet, charityClientSend } from "@/lib/charity-client";

export type PagedResult<T> = {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
};

export type GovernorateListItem = {
  governorateId: number;
  governorateName: string;
};

export type GovernorateDetails = GovernorateListItem & {
  rowVersion: string;
};

export function listGovernorates(params: {
  pageNumber: number;
  pageSize: number;
  search?: string;
}) {
  const qs = new URLSearchParams({
    pageNumber: String(params.pageNumber),
    pageSize: String(params.pageSize),
  });
  if (params.search?.trim()) qs.set("search", params.search.trim());
  return charityClientGet<PagedResult<GovernorateListItem>>(`/api/charity/governorates?${qs}`);
}

export function getGovernorate(id: number) {
  return charityClientGet<GovernorateDetails>(`/api/charity/governorates/${id}`);
}

export function createGovernorate(body: { governorateName: string }) {
  return charityClientSend<{ id: number }>("/api/charity/governorates", "POST", body);
}

export function updateGovernorate(
  id: number,
  body: { governorateName: string; rowVersion: string }
) {
  return charityClientSend<unknown>(`/api/charity/governorates/${id}`, "PUT", body);
}

export function deleteGovernorate(id: number) {
  return charityClientSend<unknown>(`/api/charity/governorates/${id}`, "DELETE");
}

export function listGovernoratesForSelect(pageSize = 200) {
  const qs = new URLSearchParams({ pageNumber: "1", pageSize: String(pageSize) });
  return charityClientGet<PagedResult<GovernorateListItem>>(`/api/charity/governorates?${qs}`);
}
