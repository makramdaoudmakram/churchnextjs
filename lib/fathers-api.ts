import { charityClientGet, charityClientSend } from "@/lib/charity-client";

export type PagedResult<T> = {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
};

export type FatherListItem = {
  fatherOfConfessionId: number;
  fatherName: string;
  churchId: number;
  churchName: string;
  mobile?: string | null;
  isActive: boolean;
};

export type FatherDetails = FatherListItem & {
  notes?: string | null;
  rowVersion: string;
};

export type ChurchOption = {
  churchId: number;
  churchName: string;
};

export function listFathers(params: {
  pageNumber: number;
  pageSize: number;
  search?: string;
}) {
  const qs = new URLSearchParams({
    pageNumber: String(params.pageNumber),
    pageSize: String(params.pageSize),
  });
  if (params.search?.trim()) qs.set("search", params.search.trim());
  return charityClientGet<PagedResult<FatherListItem>>(
    `/api/charity/fathers-of-confession?${qs}`
  );
}

export function getFather(id: number) {
  return charityClientGet<FatherDetails>(`/api/charity/fathers-of-confession/${id}`);
}

export function createFather(body: {
  fatherName: string;
  churchId: number;
  mobile?: string | null;
  notes?: string | null;
  isActive: boolean;
}) {
  return charityClientSend<{ id: number }>("/api/charity/fathers-of-confession", "POST", body);
}

export function updateFather(
  id: number,
  body: {
    fatherName: string;
    churchId: number;
    mobile?: string | null;
    notes?: string | null;
    isActive: boolean;
    rowVersion: string;
  }
) {
  return charityClientSend<unknown>(`/api/charity/fathers-of-confession/${id}`, "PUT", body);
}

export function deleteFather(id: number) {
  return charityClientSend<unknown>(`/api/charity/fathers-of-confession/${id}`, "DELETE");
}

export function listChurchesForFatherSelect(pageSize = 200) {
  const qs = new URLSearchParams({ pageNumber: "1", pageSize: String(pageSize) });
  return charityClientGet<PagedResult<ChurchOption>>(`/api/charity/churches?${qs}`);
}
