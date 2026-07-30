import type { LookupResourcePath } from "@/lib/lookup-resource-api";

/** Backend lookup type segment (works on all API builds). */
export const LOOKUP_RESOURCE_API_TYPE: Record<LookupResourcePath, string> = {
  "education-levels": "EducationLevel",
  "job-titles": "JobTitle",
  "marital-statuses": "MaritalStatus",
};

export function lookupResourceApiBase(resource: LookupResourcePath): string {
  return `/api/lookups/${LOOKUP_RESOURCE_API_TYPE[resource]}`;
}
