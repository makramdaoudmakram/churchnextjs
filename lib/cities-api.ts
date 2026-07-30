import { charityClientGet, charityClientSend } from "@/lib/charity-client";

export type PagedResult<T> = {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
};

export type CityListItem = {
  cityId: number;
  governorateId: number;
  cityName: string;
  governorateName: string;
};

export type CityDetails = CityListItem & {
  rowVersion: string;
};

export type GovernorateOption = {
  governorateId: number;
  governorateName: string;
};

export function listCities(params: {
  pageNumber: number;
  pageSize: number;
  search?: string;
  governorateId?: number;
}) {
  const qs = new URLSearchParams({
    pageNumber: String(params.pageNumber),
    pageSize: String(params.pageSize),
  });
  if (params.search?.trim()) qs.set("search", params.search.trim());
  if (params.governorateId) qs.set("governorateId", String(params.governorateId));
  return charityClientGet<PagedResult<CityListItem>>(`/api/charity/cities?${qs}`);
}

export function getCity(id: number) {
  return charityClientGet<CityDetails>(`/api/charity/cities/${id}`);
}

export function createCity(body: { governorateId: number; cityName: string }) {
  return charityClientSend<{ id: number }>("/api/charity/cities", "POST", body);
}

export function updateCity(
  id: number,
  body: { governorateId: number; cityName: string; rowVersion: string }
) {
  return charityClientSend<unknown>(`/api/charity/cities/${id}`, "PUT", body);
}

export function deleteCity(id: number) {
  return charityClientSend<unknown>(`/api/charity/cities/${id}`, "DELETE");
}

export { listGovernoratesForSelect as listGovernorates } from "@/lib/governorates-api";

export function listCitiesForSelect(pageSize = 200) {
  const qs = new URLSearchParams({ pageNumber: "1", pageSize: String(pageSize) });
  return charityClientGet<PagedResult<CityListItem>>(`/api/charity/cities?${qs}`);
}
