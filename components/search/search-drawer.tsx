"use client";

import * as React from "react";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { SearchFieldControl } from "@/components/search/search-field-control";
import { executeSearch, fetchSearchMetadata } from "@/lib/search/search-api";
import { buildSearchFilters, emptyFilterState } from "@/lib/search/search-utils";
import type {
  ApplicationSearchMetadata,
  GenericSearchResponse,
  SearchFilterInput,
  SearchFilterState,
} from "@/lib/search/types";
import { apiErrorMessage } from "@/lib/api-form-utils";

export type SearchDrawerProps = {
  applicationId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResults: (result: GenericSearchResponse, filterSummary: string, filters: SearchFilterInput[]) => void;
  closeOnSearch?: boolean;
  title?: string;
};

export function SearchDrawer({
  applicationId,
  open,
  onOpenChange,
  onResults,
  closeOnSearch = false,
  title = "Advanced search",
}: SearchDrawerProps) {
  const [meta, setMeta] = React.useState<ApplicationSearchMetadata | null>(null);
  const [metaLoading, setMetaLoading] = React.useState(false);
  const [filters, setFilters] = React.useState<SearchFilterState>(emptyFilterState());
  const [searching, setSearching] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setMetaLoading(true);
      const res = await fetchSearchMetadata(applicationId);
      if (cancelled) return;
      if (!res.success || !res.data) {
        toast.error(apiErrorMessage(res, "Could not load search fields."));
        setMeta(null);
      } else {
        setMeta(res.data);
        setFilters(emptyFilterState());
      }
      setMetaLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, applicationId]);

  const runSearch = async () => {
    setSearching(true);
    const filterList = buildSearchFilters(filters);
    const res = await executeSearch({
      applicationId,
      filters: filterList,
      pageNumber: 1,
      pageSize: 50,
    });
    setSearching(false);
    if (!res.success || !res.data) {
      toast.error(apiErrorMessage(res, "Search failed."));
      return;
    }
    const summary = filterList
      .map((f) => {
        const label = meta?.searchFields.find((x) => x.columnName === f.columnName)?.displayName ?? f.columnName;
        const val = f.values?.length ? f.values.join(", ") : String(f.value ?? "");
        return `${label}: ${val}`;
      })
      .join(" | ");
    onResults(res.data, summary, filterList);
    if (closeOnSearch) onOpenChange(false);
  };

  const reset = () => setFilters(emptyFilterState());

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex h-full w-[40vw] max-w-[40vw] flex-col gap-0 p-0 sm:max-w-[40vw]"
      >
        <SheetHeader className="shrink-0 border-b px-4 py-4">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{meta?.name ?? "Loading fields…"}</SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          {metaLoading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2Icon className="size-4 animate-spin" />
              Loading search fields…
            </div>
          )}
          {!metaLoading && meta && (
            <div className="grid grid-cols-12 gap-3">
              {meta.searchFields.map((field) => (
                <SearchFieldControl
                  key={field.id}
                  applicationId={applicationId}
                  field={field}
                  value={filters[field.columnName]?.value}
                  values={filters[field.columnName]?.values}
                  onChange={(next) =>
                    setFilters((prev) => ({
                      ...prev,
                      [field.columnName]: next,
                    }))
                  }
                />
              ))}
            </div>
          )}
        </div>

        <SheetFooter className="shrink-0 flex-row border-t bg-background px-4 py-3">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button type="button" variant="secondary" onClick={reset} disabled={searching}>
            Reset
          </Button>
          <Button type="button" onClick={() => void runSearch()} disabled={searching || metaLoading}>
            {searching ? <Loader2Icon className="size-4 animate-spin" /> : null}
            Search
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
