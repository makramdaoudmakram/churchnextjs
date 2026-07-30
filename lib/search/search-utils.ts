import type { SearchFilterInput, SearchFilterState } from "@/lib/search/types";

export function buildSearchFilters(state: SearchFilterState): SearchFilterInput[] {
  const filters: SearchFilterInput[] = [];
  for (const [columnName, entry] of Object.entries(state)) {
    if (entry.values?.length) {
      filters.push({ columnName, values: entry.values });
      continue;
    }
    const v = entry.value?.trim();
    if (v) filters.push({ columnName, value: v });
  }
  return filters;
}

export function emptyFilterState(): SearchFilterState {
  return {};
}

export function formatCellValue(value: unknown): string {
  if (value == null || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (value instanceof Date) return value.toLocaleDateString();
  const s = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    try {
      return new Date(s).toLocaleDateString();
    } catch {
      return s;
    }
  }
  return s;
}
