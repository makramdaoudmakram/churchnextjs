"use client";

import * as React from "react";
import { SearchIcon } from "lucide-react";
import { SearchDrawer } from "@/components/search/search-drawer";
import { SearchResultsTable } from "@/components/search/search-results-table";
import { Button } from "@/components/ui/button";
import { APPLICANTS_SEARCH_APPLICATION_ID } from "@/lib/search/types";
import type { GenericSearchResponse, SearchFilterInput } from "@/lib/search/types";

export function SearchPageClient() {
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [result, setResult] = React.useState<GenericSearchResponse | null>(null);
  const [filterSummary, setFilterSummary] = React.useState("");
  const [baseFilters, setBaseFilters] = React.useState<SearchFilterInput[]>([]);

  return (
    <div className="flex flex-col gap-4 px-4 pb-8 lg:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Search</h1>
          <p className="text-sm text-muted-foreground">
            Advanced search for charity applications. Results appear in the table below.
          </p>
        </div>
        <Button type="button" onClick={() => setDrawerOpen(true)}>
          <SearchIcon className="size-4" />
          Search
        </Button>
      </div>

      <SearchDrawer
        applicationId={APPLICANTS_SEARCH_APPLICATION_ID}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title="Search applicants"
        onResults={(data, summary, filters) => {
          setResult(data);
          setFilterSummary(summary);
          setBaseFilters(filters);
        }}
      />

      {result ?
        <SearchResultsTable
          applicationId={APPLICANTS_SEARCH_APPLICATION_ID}
          result={result}
          baseFilters={baseFilters}
          filterSummary={filterSummary}
          onPageChange={setResult}
        />
      : <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          Open Search, set filters (all optional), then press Search to load results.
        </div>
      }
    </div>
  );
}
