import { charityClientGet, charityClientSend } from "@/lib/charity-client";

export type PagedResult<T> = {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
};

export type SupervisorListItem = {
  supervisorId: number;
  name: string;
};

export type SupervisorDetails = SupervisorListItem & { rowVersion: string };

export function listSupervisors(params: { pageNumber: number; pageSize: number; search?: string }) {
  const qs = new URLSearchParams({
    pageNumber: String(params.pageNumber),
    pageSize: String(params.pageSize),
  });
  if (params.search?.trim()) qs.set("search", params.search.trim());
  return charityClientGet<PagedResult<SupervisorListItem>>(`/api/charity/supervisors?${qs}`);
}

export function getSupervisor(id: number) {
  return charityClientGet<SupervisorDetails>(`/api/charity/supervisors/${id}`);
}

export function createSupervisor(body: { name: string }) {
  return charityClientSend<{ id: number }>("/api/charity/supervisors", "POST", body);
}

export function updateSupervisor(id: number, body: Record<string, unknown>) {
  return charityClientSend<unknown>(`/api/charity/supervisors/${id}`, "PUT", body);
}

export function deleteSupervisor(id: number) {
  return charityClientSend<unknown>(`/api/charity/supervisors/${id}`, "DELETE");
}

export function listSupervisorsForSelect(pageSize = 200) {
  return listSupervisors({ pageNumber: 1, pageSize });
}
