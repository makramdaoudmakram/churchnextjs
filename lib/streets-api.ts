import { charityClientGet, charityClientSend } from "@/lib/charity-client";

export type PagedResult<T> = {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
};

export type StreetListItem = {
  streetId: number;
  areaId: number;
  streetName: string;
  areaName: string;
};

export type StreetDetails = StreetListItem & {
  rowVersion: string;
};

export type AreaOption = {
  areaId: number;
  areaName: string;
  cityName: string;
};

export function listStreets(params: {
  pageNumber: number;
  pageSize: number;
  search?: string;
  areaId?: number;
}) {
  const qs = new URLSearchParams({
    pageNumber: String(params.pageNumber),
    pageSize: String(params.pageSize),
  });
  if (params.search?.trim()) qs.set("search", params.search.trim());
  if (params.areaId) qs.set("areaId", String(params.areaId));
  return charityClientGet<PagedResult<StreetListItem>>(`/api/charity/streets?${qs}`);
}

export function getStreet(id: number) {
  return charityClientGet<StreetDetails>(`/api/charity/streets/${id}`);
}

export function createStreet(body: { areaId: number; streetName: string }) {
  return charityClientSend<{ id: number }>("/api/charity/streets", "POST", body);
}

export function updateStreet(
  id: number,
  body: { areaId: number; streetName: string; rowVersion: string }
) {
  return charityClientSend<unknown>(`/api/charity/streets/${id}`, "PUT", body);
}

export function deleteStreet(id: number) {
  return charityClientSend<unknown>(`/api/charity/streets/${id}`, "DELETE");
}

export function listAreasForStreetSelect(pageSize = 300) {
  const qs = new URLSearchParams({ pageNumber: "1", pageSize: String(pageSize) });
  return charityClientGet<PagedResult<AreaOption>>(`/api/charity/areas?${qs}`);
}
