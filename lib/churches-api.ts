import { charityClientGet, charityClientSend } from "@/lib/charity-client";

export type ChurchListItem = {
  churchId: number;
  churchName: string;
  areaId: number;
  areaName: string;
  phone?: string | null;
};

export type ChurchDetails = ChurchListItem & {
  rowVersion: string;
};

export type PagedResult<T> = {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
};

export type AreaOption = {
  areaId: number;
  areaName: string;
  cityName: string;
};

export function listChurches(params: {
  pageNumber: number;
  pageSize: number;
  search?: string;
}) {
  const qs = new URLSearchParams({
    pageNumber: String(params.pageNumber),
    pageSize: String(params.pageSize),
  });
  if (params.search?.trim()) {
    qs.set("search", params.search.trim());
  }
  return charityClientGet<PagedResult<ChurchListItem>>(`/api/charity/churches?${qs}`);
}

export function getChurch(id: number) {
  return charityClientGet<ChurchDetails>(`/api/charity/churches/${id}`);
}

export function createChurch(body: {
  churchName: string;
  areaId: number;
  phone?: string | null;
}) {
  return charityClientSend<{ id: number }>("/api/charity/churches", "POST", body);
}

export function updateChurch(
  id: number,
  body: {
    churchName: string;
    areaId: number;
    phone?: string | null;
    rowVersion: string;
  }
) {
  return charityClientSend<unknown>(`/api/charity/churches/${id}`, "PUT", body);
}

export function deleteChurch(id: number) {
  return charityClientSend<unknown>(`/api/charity/churches/${id}`, "DELETE");
}

export function listAreas(pageSize = 100) {
  const qs = new URLSearchParams({
    pageNumber: "1",
    pageSize: String(pageSize),
  });
  return charityClientGet<PagedResult<AreaOption>>(`/api/charity/areas?${qs}`);
}
