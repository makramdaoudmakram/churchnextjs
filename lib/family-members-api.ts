import { charityClientGet, charityClientSend } from "@/lib/charity-client";

export type PagedResult<T> = {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
};

export type FamilyMemberListItem = {
  familyMemberId: number;
  applicantId: number;
  fullName: string;
  relationshipId: number;
  relationshipName: string;
  educationLevelId: number;
  educationLevelName: string;
  fatherOfConfessionId: number;
  fatherOfConfessionName: string;
  age?: number | null;
  salary?: number | null;
};

export type FamilyMemberDetails = FamilyMemberListItem & {
  school?: string | null;
  mobile?: string | null;
  rowVersion: string;
};

export function listFamilyMembers(params: {
  pageNumber: number;
  pageSize: number;
  applicantId: number;
  search?: string;
}) {
  const qs = new URLSearchParams({
    pageNumber: String(params.pageNumber),
    pageSize: String(params.pageSize),
    applicantId: String(params.applicantId),
  });
  if (params.search?.trim()) qs.set("search", params.search.trim());
  return charityClientGet<PagedResult<FamilyMemberListItem>>(`/api/charity/family-members?${qs}`);
}

export function getFamilyMember(id: number) {
  return charityClientGet<FamilyMemberDetails>(`/api/charity/family-members/${id}`);
}

export function createFamilyMember(body: {
  applicantId: number;
  fullName: string;
  relationshipId: number;
  educationLevelId: number;
  fatherOfConfessionId: number;
  school?: string | null;
  age?: number | null;
  salary?: number | null;
  mobile?: string | null;
}) {
  return charityClientSend<{ id: number }>("/api/charity/family-members", "POST", body);
}

export function updateFamilyMember(id: number, body: Record<string, unknown>) {
  return charityClientSend<unknown>(`/api/charity/family-members/${id}`, "PUT", body);
}

export function deleteFamilyMember(id: number) {
  return charityClientSend<unknown>(`/api/charity/family-members/${id}`, "DELETE");
}
