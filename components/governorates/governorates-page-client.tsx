"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { Loader2Icon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { useCharityWrite } from "@/hooks/use-charity-write";
import { SettingsPermissionBanner } from "@/components/settings-permission-banner";

import {
  createGovernorate,
  deleteGovernorate,
  getGovernorate,
  listGovernorates,
  updateGovernorate,
  type GovernorateListItem,
} from "@/lib/governorates-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type SheetMode = "create" | "edit";

const emptyForm = {
  governorateName: "",
  rowVersion: "",
};

export function GovernoratesPageClient() {
  const { canWrite } = useCharityWrite("lookups");

  const [rows, setRows] = React.useState<GovernorateListItem[]>([]);
  const [totalCount, setTotalCount] = React.useState(0);
  const [pageNumber, setPageNumber] = React.useState(1);
  const [pageSize] = React.useState(10);
  const [search, setSearch] = React.useState("");
  const [searchInput, setSearchInput] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [sheetMode, setSheetMode] = React.useState<SheetMode>("create");
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const [form, setForm] = React.useState(emptyForm);
  const [saving, setSaving] = React.useState(false);

  const loadRows = React.useCallback(async () => {
    setLoading(true);
    const result = await listGovernorates({ pageNumber, pageSize, search });
    setLoading(false);

    if (!result.success || !result.data) {
      toast.error(
        result.message ??
          result.errors?.join(", ") ??
          "Failed to load governorates. Log out and sign in again if you see Unauthorized."
      );
      setRows([]);
      setTotalCount(0);
      return;
    }

    setRows(result.data.items ?? []);
    setTotalCount(result.data.totalCount ?? 0);
  }, [pageNumber, pageSize, search]);

  React.useEffect(() => {
    void loadRows();
  }, [loadRows]);

  React.useEffect(() => {
    const t = setTimeout(() => {
      setPageNumber(1);
      setSearch(searchInput);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const openCreate = () => {
    setSheetMode("create");
    setEditingId(null);
    setForm(emptyForm);
    setSheetOpen(true);
  };

  const openEdit = React.useCallback(async (row: GovernorateListItem) => {
    setSheetMode("edit");
    setEditingId(row.governorateId);
    setSheetOpen(true);
    setSaving(true);

    const result = await getGovernorate(row.governorateId);
    setSaving(false);

    if (!result.success || !result.data) {
      toast.error(result.message ?? "Could not load governorate");
      setSheetOpen(false);
      return;
    }

    setForm({
      governorateName: result.data.governorateName,
      rowVersion: result.data.rowVersion,
    });
  }, []);

  const onDelete = React.useCallback(
    async (row: GovernorateListItem) => {
      if (!confirm(`Delete "${row.governorateName}"?`)) return;
      const result = await deleteGovernorate(row.governorateId);
      if (!result.success) {
        toast.error(
          result.message ??
            result.errors?.join(", ") ??
            "Delete failed. If this governorate has cities, delete those cities first."
        );
        return;
      }
      toast.success(result.message ?? "Governorate deleted");
      void loadRows();
    },
    [loadRows]
  );

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.governorateName.trim()) {
      toast.error("Governorate name is required");
      return;
    }

    setSaving(true);
    const name = form.governorateName.trim();

    if (sheetMode === "create") {
      const result = await createGovernorate({ governorateName: name });
      setSaving(false);
      if (!result.success) {
        toast.error(
          result.message ??
            result.errors?.join(", ") ??
            "Create failed — check the list; the item may already have been saved."
        );
        return;
      }
      toast.success(result.message ?? "Governorate created");
    } else if (editingId !== null) {
      const result = await updateGovernorate(editingId, {
        governorateName: name,
        rowVersion: form.rowVersion,
      });
      setSaving(false);
      if (!result.success) {
        toast.error(result.message ?? result.errors?.join(", ") ?? "Update failed");
        return;
      }
      toast.success(result.message ?? "Governorate updated");
    }

    setSheetOpen(false);
    void loadRows();
  };

  const columns = React.useMemo<ColumnDef<GovernorateListItem>[]>(
    () => [
      { accessorKey: "governorateId", header: "ID" },
      { accessorKey: "governorateName", header: "Governorate name" },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={!canWrite}
              onClick={() => void openEdit(row.original)}
            >
              <PencilIcon className="size-4" />
              <span className="sr-only">Edit</span>
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-destructive hover:text-destructive"
              disabled={!canWrite}
              onClick={() => void onDelete(row.original)}
            >
              <Trash2Icon className="size-4" />
              <span className="sr-only">Delete</span>
            </Button>
          </div>
        ),
      },
    ],
    [openEdit, onDelete, canWrite]
  );

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <div className="flex flex-col gap-4 px-4 lg:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Governorates</h1>
          <p className="text-sm text-muted-foreground">Top-level regions for cities and areas.</p>
        </div>
        <Button onClick={openCreate} disabled={!canWrite}>
          <PlusIcon className="size-4" />
          Add governorate
        </Button>
      </div>

      <SettingsPermissionBanner resource="lookups" />

      <Input
        placeholder="Search governorates…"
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        className="max-w-sm"
      />

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <Loader2Icon className="mx-auto size-5 animate-spin text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  No governorates found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Page {pageNumber} of {totalPages} · {totalCount} total
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={pageNumber <= 1 || loading}
            onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={pageNumber >= totalPages || loading}
            onClick={() => setPageNumber((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{sheetMode === "create" ? "Add governorate" : "Edit governorate"}</SheetTitle>
            <SheetDescription>Name only — cities link to a governorate.</SheetDescription>
          </SheetHeader>

          <form id="gov-form" onSubmit={onSave} className="flex flex-col gap-4 px-4">
            <div className="grid gap-2">
              <Label htmlFor="governorateName">Governorate name</Label>
              <Input
                id="governorateName"
                value={form.governorateName}
                onChange={(e) => setForm((f) => ({ ...f, governorateName: e.target.value }))}
                required
              />
            </div>
          </form>

          <SheetFooter>
            <Button type="submit" form="gov-form" disabled={saving}>
              {saving && <Loader2Icon className="size-4 animate-spin" />}
              Save
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
