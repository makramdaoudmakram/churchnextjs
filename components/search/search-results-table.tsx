"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type RowSelectionState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import { ChevronLeftIcon, ChevronRightIcon, PrinterIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { executeSearch } from "@/lib/search/search-api";
import { formatCellValue } from "@/lib/search/search-utils";
import type { GenericSearchResponse, SearchFilterInput } from "@/lib/search/types";
import { getApplicant } from "@/lib/applicants-api";
import {
  openCaseStudyPrintTarget,
  printApplicantCaseStudy,
  type ApplicantPrintPayload,
} from "@/lib/search/print-applicant-case-study";
import { apiErrorMessage } from "@/lib/api-form-utils";

type Props = {
  applicationId: number;
  result: GenericSearchResponse;
  baseFilters: SearchFilterInput[];
  filterSummary: string;
  onPageChange: (result: GenericSearchResponse) => void;
};

export function SearchResultsTable({
  applicationId,
  result,
  baseFilters,
  filterSummary,
  onPageChange,
}: Props) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [loadingPage, setLoadingPage] = React.useState(false);
  const [printingId, setPrintingId] = React.useState<number | null>(null);

  const pk = result.primaryKeyColumn;

  const handlePrint = React.useCallback(
    async (applicantId: number, printTarget: Window | null) => {
      setPrintingId(applicantId);
      const res = await getApplicant(applicantId);
      setPrintingId(null);
      if (!res.success || !res.data) {
        if (printTarget && !printTarget.closed) {
          try {
            printTarget.close();
          } catch {
            /* ignore */
          }
        }
        toast.error(apiErrorMessage(res, "Could not load applicant for printing."));
        return;
      }
      try {
        printApplicantCaseStudy(res.data as ApplicantPrintPayload, filterSummary, printTarget);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Print failed.");
      }
    },
    [filterSummary]
  );

  const startPrint = React.useCallback(
    (applicantId: number) => {
      const printTarget = openCaseStudyPrintTarget();
      if (!printTarget) {
        toast.message("Pop-up blocked — printing in-page instead.", {
          description: "Allow pop-ups for a separate preview window, or use the print dialog that opens.",
        });
      }
      void handlePrint(applicantId, printTarget);
    },
    [handlePrint]
  );

  const columns = React.useMemo<ColumnDef<Record<string, unknown>>[]>(() => {
    const dataCols: ColumnDef<Record<string, unknown>>[] = result.columns.map((col) => ({
      id: col.columnName,
      accessorFn: (row) => row[col.columnName] ?? row[col.columnName.toLowerCase()],
      header: col.displayName,
      cell: ({ getValue }) => formatCellValue(getValue()),
      enableSorting: true,
    }));
    dataCols.push({
      id: "actions",
      header: "Print",
      enableSorting: false,
      cell: ({ row }) => {
        const id = row.original[pk] ?? row.original[pk.toLowerCase()];
        const numId = typeof id === "number" ? id : Number(id);
        if (!Number.isFinite(numId)) return null;
        return (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={printingId === numId}
            onClick={(e) => {
              e.stopPropagation();
              startPrint(numId);
            }}
          >
            <PrinterIcon className="size-3.5" />
          </Button>
        );
      },
    });
    return dataCols;
  }, [result.columns, pk, printingId, startPrint]);

  const table = useReactTable({
    data: result.items,
    columns,
    state: { sorting, columnFilters, columnVisibility, rowSelection, globalFilter },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    pageCount: Math.max(1, Math.ceil(result.totalCount / result.pageSize)),
    enableRowSelection: true,
  });

  const printSelected = () => {
    const keys = Object.keys(rowSelection).filter((k) => rowSelection[k]);
    if (keys.length !== 1) {
      toast.message("Select one row to print the case study.");
      return;
    }
    const row = table.getRowModel().rows.find((r) => r.id === keys[0]);
    if (!row) return;
    const id = row.original[pk] ?? row.original[pk.toLowerCase()];
    const numId = typeof id === "number" ? id : Number(id);
    if (Number.isFinite(numId)) startPrint(numId);
  };

  const goPage = async (pageNumber: number) => {
    setLoadingPage(true);
    const sort = sorting[0];
    const res = await executeSearch({
      applicationId,
      filters: baseFilters,
      pageNumber,
      pageSize: result.pageSize,
      sortColumn: sort?.id && sort.id !== "actions" ? sort.id : undefined,
      sortDirection: sort?.desc ? "desc" : "asc",
    });
    setLoadingPage(false);
    if (res.success && res.data) onPageChange(res.data);
    else toast.error(apiErrorMessage(res, "Could not load page."));
  };

  return (
    <div className="search-results-panel space-y-3">
      <div className="flex flex-wrap items-center gap-2 no-print">
        <Input
          placeholder="Filter results…"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-xs"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {table
              .getAllColumns()
              .filter((c) => c.getCanHide())
              .map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  checked={column.getIsVisible()}
                  onCheckedChange={(v) => column.toggleVisibility(!!v)}
                >
                  {typeof column.columnDef.header === "string" ? column.columnDef.header : column.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <span className="text-sm text-muted-foreground">{result.totalCount} record(s)</span>
      </div>

      <div className="overflow-auto rounded-md border max-h-[min(70vh,720px)]">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-muted/95 backdrop-blur">
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="whitespace-nowrap cursor-pointer select-none"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {{ asc: " ↑", desc: " ↓" }[header.column.getIsSorted() as string] ?? null}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ?
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="cursor-pointer"
                  onClick={() => row.toggleSelected(true)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            : <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  No results.
                </TableCell>
              </TableRow>
            }
          </TableBody>
        </Table>
      </div>

      {result.grandTotals && Object.keys(result.grandTotals).length > 0 && (
        <div className="text-sm text-muted-foreground">
          Totals:{" "}
          {Object.entries(result.grandTotals)
            .map(([k, v]) => `${k}: ${v}`)
            .join(" · ")}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3 no-print">
        <div className="flex items-center gap-2">
          <Button type="button" variant="default" onClick={printSelected}>
            <PrinterIcon className="size-4" />
            Print case study (selected row)
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => window.print()}>
            Print results table
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon-sm"
            disabled={result.pageNumber <= 1 || loadingPage}
            onClick={() => void goPage(result.pageNumber - 1)}
          >
            <ChevronLeftIcon />
          </Button>
          <span className="text-sm tabular-nums">
            Page {result.pageNumber} / {Math.max(1, Math.ceil(result.totalCount / result.pageSize))}
          </span>
          <Button
            variant="outline"
            size="icon-sm"
            disabled={
              result.pageNumber >= Math.ceil(result.totalCount / result.pageSize) || loadingPage
            }
            onClick={() => void goPage(result.pageNumber + 1)}
          >
            <ChevronRightIcon />
          </Button>
        </div>
      </div>
    </div>
  );
}
