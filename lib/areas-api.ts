import { charityClientGet, charityClientSend } from "@/lib/charity-client";

export type PagedResult<T> = {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
};

export type AreaListItem = {
  areaId: number;
  cityId: number;
  areaName: string;
  cityName: string;
};

export type AreaDetails = AreaListItem & {
  rowVersion: string;
};

export type CityOption = {
  cityId: number;
  cityName: string;
  governorateName: string;
};

export function listAreas(params: {
  pageNumber: number;
  pageSize: number;
  search?: string;
  cityId?: number;
}) {
  const qs = new URLSearchParams({
    pageNumber: String(params.pageNumber),
    pageSize: String(params.pageSize),
  });
  if (params.search?.trim()) qs.set("search", params.search.trim());
  if (params.cityId) qs.set("cityId", String(params.cityId));
  return charityClientGet<PagedResult<AreaListItem>>(`/api/charity/areas?${qs}`);
}

export function getArea(id: number) {
  return charityClientGet<AreaDetails>(`/api/charity/areas/${id}`);
}

export function createArea(body: { cityId: number; areaName: string }) {
  return charityClientSend<{ id: number }>("/api/charity/areas", "POST", body);
}

export function updateArea(
  id: number,
  body: { cityId: number; areaName: string; rowVersion: string }
) {
  return charityClientSend<unknown>(`/api/charity/areas/${id}`, "PUT", body);
}

export function deleteArea(id: number) {
  return charityClientSend<unknown>(`/api/charity/areas/${id}`, "DELETE");
}

export function listCities(pageSize = 200) {
  const qs = new URLSearchParams({ pageNumber: "1", pageSize: String(pageSize) });
  return charityClientGet<PagedResult<CityOption>>(`/api/charity/cities?${qs}`);
}
