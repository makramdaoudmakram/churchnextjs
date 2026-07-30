/** Charity generic search — ApplicationId 1 = APPLICANTS (see churchapi migration seed). */
export const APPLICANTS_SEARCH_APPLICATION_ID = 1;

export type EnumOption = { value: string; label: string };

export type ApplicationFieldMetadata = {
  id: number;
  applicationId: number;
  columnName: string;
  displayName: string;
  dataType: string;
  controlType: string;
  isSearchable: boolean;
  visible: boolean;
  required: boolean;
  lookupTable: string | null;
  lookupDisplayField: string | null;
  lookupValueField: string | null;
  searchOperator: string;
  displayOrder: number;
  width: number;
  enumOptions: EnumOption[] | null;
};

export type ApplicationSearchMetadata = {
  applicationId: number;
  code: string;
  name: string;
  primaryKeyColumn: string;
  searchFields: ApplicationFieldMetadata[];
  resultColumns: ApplicationFieldMetadata[];
};

export type SearchFilterInput = {
  columnName: string;
  value?: unknown;
  values?: unknown[];
};

export type GenericSearchRequest = {
  applicationId: number;
  filters: SearchFilterInput[];
  pageNumber: number;
  pageSize: number;
  sortColumn?: string;
  sortDirection?: "asc" | "desc";
};

export type SearchColumnMeta = {
  columnName: string;
  displayName: string;
  dataType: string;
};

export type GenericSearchResponse = {
  items: Record<string, unknown>[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  primaryKeyColumn: string;
  columns: SearchColumnMeta[];
  grandTotals?: Record<string, number> | null;
};

export type LookupOption = { value: unknown; label: string };

export type SearchFilterState = Record<
  string,
  { value?: string; values?: string[] }
>;
