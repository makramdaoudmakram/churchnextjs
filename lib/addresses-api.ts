import { charityClientGet, charityClientSend } from "@/lib/charity-client";

export type PagedResult<T> = {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
};

export type AddressListItem = {
  addressId: number;
  streetId: number;
  streetName: string;
  areaId: number;
  areaName: string;
  buildingNo?: string | null;
};

export type AddressDetails = AddressListItem & {
  floorNo?: string | null;
  apartmentNo?: string | null;
  landmark?: string | null;
  postalCode?: string | null;
  rowVersion: string;
};

export type StreetOption = { streetId: number; streetName: string; areaName: string };
export type AreaOption = { areaId: number; areaName: string; cityName: string };

export function listAddresses(params: { pageNumber: number; pageSize: number; search?: string }) {
  const qs = new URLSearchParams({
    pageNumber: String(params.pageNumber),
    pageSize: String(params.pageSize),
  });
  if (params.search?.trim()) qs.set("search", params.search.trim());
  return charityClientGet<PagedResult<AddressListItem>>(`/api/charity/addresses?${qs}`);
}

export function getAddress(id: number) {
  return charityClientGet<AddressDetails>(`/api/charity/addresses/${id}`);
}

export function createAddress(body: {
  streetId: number;
  areaId: number;
  buildingNo?: string | null;
  floorNo?: string | null;
  apartmentNo?: string | null;
  landmark?: string | null;
  postalCode?: string | null;
}) {
  return charityClientSend<{ id: number }>("/api/charity/addresses", "POST", body);
}

export function updateAddress(id: number, body: Record<string, unknown>) {
  return charityClientSend<unknown>(`/api/charity/addresses/${id}`, "PUT", body);
}

export function deleteAddress(id: number) {
  return charityClientSend<unknown>(`/api/charity/addresses/${id}`, "DELETE");
}

export function listStreetsForAddress(pageSize = 300) {
  const qs = new URLSearchParams({ pageNumber: "1", pageSize: String(pageSize) });
  return charityClientGet<PagedResult<StreetOption>>(`/api/charity/streets?${qs}`);
}

export function listAreasForAddress(pageSize = 300) {
  const qs = new URLSearchParams({ pageNumber: "1", pageSize: String(pageSize) });
  return charityClientGet<PagedResult<AreaOption>>(`/api/charity/areas?${qs}`);
}

export function listAddressesForSelect(pageSize = 300) {
  const qs = new URLSearchParams({ pageNumber: "1", pageSize: String(pageSize) });
  return charityClientGet<PagedResult<AddressListItem>>(`/api/charity/addresses?${qs}`);
}
