import { charityClientGet, charityClientSend } from "@/lib/charity-client";

export type PagedResult<T> = {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
};

export type ApplicantListItem = {
  applicantId: number;
  fullName: string;
  nationalId: string;
  mobile: string;
  supervisorName: string;
  salary: number;
  birthDate: string;
};

export type ApplicantDetails = {
  applicantId: number;
  fullName: string;
  birthDate: string;
  nationalId: string;
  salary: number;
  mobile: string;
  healthStatus?: string | null;
  anotherSourceInc?: string | null;
  houseDescrip?: string | null;
  otherPersonHou?: string | null;
  serReport?: string | null;
  rowVersion: string;
  educationLevel?: { id: number; name: string } | null;
  jobTitle?: { id: number; name: string } | null;
  maritalStatus?: { id: number; name: string } | null;
  fatherOfConfession?: { fatherOfConfessionId: number; fatherName: string } | null;
  supervisor?: { supervisorId: number; name: string } | null;
  address?: {
    addressId: number;
    buildingNo?: string | null;
    floorNo?: string | null;
    apartmentNo?: string | null;
    landmark?: string | null;
  } | null;
  church?: { churchId: number; churchName: string } | null;
  governorate?: { governorateId: number; governorateName: string } | null;
  city?: { cityId: number; cityName: string } | null;
  area?: { areaId: number; areaName: string } | null;
  street?: { streetId: number; streetName: string } | null;
  familyMembers?: Array<{
    fullName: string;
    relationshipName?: string;
    age?: number | null;
    educationLevelName?: string;
    salary?: number | null;
  }>;
  incomeSources?: Array<{
    incomeTypeName?: string;
    amount?: number;
    notes?: string | null;
  }>;
};

export function listApplicants(params: { pageNumber: number; pageSize: number; search?: string }) {
  const qs = new URLSearchParams({
    pageNumber: String(params.pageNumber),
    pageSize: String(params.pageSize),
  });
  if (params.search?.trim()) qs.set("search", params.search.trim());
  return charityClientGet<PagedResult<ApplicantListItem>>(`/api/charity/applicants?${qs}`);
}

export function getApplicant(id: number) {
  return charityClientGet<ApplicantDetails>(`/api/charity/applicants/${id}`);
}

export function createApplicant(body: Record<string, unknown>) {
  return charityClientSend<{ id: number }>("/api/charity/applicants", "POST", body);
}

export function updateApplicant(id: number, body: Record<string, unknown>) {
  return charityClientSend<unknown>(`/api/charity/applicants/${id}`, "PUT", body);
}

export function deleteApplicant(id: number) {
  return charityClientSend<unknown>(`/api/charity/applicants/${id}`, "DELETE");
}
