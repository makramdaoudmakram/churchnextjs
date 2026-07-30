import { charityClientGet, charityClientSend } from "@/lib/charity-client";
import type {
  ApplicationSearchMetadata,
  GenericSearchRequest,
  GenericSearchResponse,
  LookupOption,
} from "@/lib/search/types";

export function fetchSearchMetadata(applicationId: number) {
  return charityClientGet<ApplicationSearchMetadata>(
    `/api/charity/search/applications/${applicationId}/fields`
  );
}

export function executeSearch(body: GenericSearchRequest) {
  return charityClientSend<GenericSearchResponse>("/api/charity/search", "POST", body);
}

export function fetchFieldLookup(
  applicationId: number,
  fieldId: number,
  q?: string,
  maxRows = 200
) {
  const qs = new URLSearchParams({ maxRows: String(maxRows) });
  if (q?.trim()) qs.set("q", q.trim());
  return charityClientGet<LookupOption[]>(
    `/api/charity/search/applications/${applicationId}/fields/${fieldId}/lookup?${qs}`
  );
}
