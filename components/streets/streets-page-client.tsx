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
import { apiErrorMessage, normalizeRowVersion } from "@/lib/api-form-utils";

import {
  createStreet,
  deleteStreet,
  getStreet,
  listAreasForStreetSelect,
  listStreets,
  updateStreet,
  type AreaOption,
  type StreetListItem,
} from "@/lib/streets-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  streetName: "",
  areaId: "",
  rowVersion: "",
};

export function StreetsPageClient() {
  const { canWrite } = useCharityWrite("lookups");

  const [rows, setRows] = React.useState<StreetListItem[]>([]);
  const [totalCount, setTotalCount] = React.useState(0);
  const [pageNumber, setPageNumber] = React.useState(1);
  const [pageSize] = React.useState(10);
  const [search, setSearch] = React.useState("");
  const [searchInput, setSearchInput] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [areas, setAreas] = React.useState<AreaOption[]>([]);

  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [sheetMode, setSheetMode] = React.useState<SheetMode>("create");
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const [form, setForm] = React.useState(emptyForm);
  const [saving, setSaving] = React.useState(false);

  const loadRows = React.useCallback(async () => {
    setLoading(true);
    const result = await listStreets({ pageNumber, pageSize, search });
    setLoading(false);

    if (!result.success || !result.data) {
      toast.error(apiErrorMessage(result, "Failed to load streets"));
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
    void (async () => {
      const result = await listAreasForStreetSelect(300);
      if (result.success && result.data?.items) {
        setAreas(result.data.items);
      }
    })();
  }, []);

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

  const openEdit = React.useCallback(async (row: StreetListItem) => {
    setSheetMode("edit");
    setEditingId(row.streetId);
    setSheetOpen(true);
    setSaving(true);

    const result = await getStreet(row.streetId);
    setSaving(false);

    if (!result.success || !result.data) {
      toast.error(apiErrorMessage(result, "Could not load street details"));
      setSheetOpen(false);
      return;
    }

    const d = result.data;
    setForm({
      streetName: d.streetName,
      areaId: String(d.areaId),
      rowVersion: normalizeRowVersion(d.rowVersion),
    });
  }, []);

  const onDelete = React.useCallback(
    async (row: StreetListItem) => {
      if (!confirm(`Delete "${row.streetName}"?`)) return;
      const result = await deleteStreet(row.streetId);
      if (!result.success) {
        toast.error(apiErrorMessage(result, "Delete failed"));
        return;
      }
      toast.success(result.message ?? "Street deleted");
      void loadRows();
    },
    [loadRows]
  );

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.streetName.trim()) {
      toast.error("Street name is required");
      return;
    }
    if (!form.areaId) {
      toast.error("Area is required");
      return;
    }

    setSaving(true);
    const payload = {
      streetName: form.streetName.trim(),
      areaId: Number(form.areaId),
    };

    if (sheetMode === "create") {
      const result = await createStreet(payload);
      setSaving(false);
      if (!result.success) {
        toast.error(apiErrorMessage(result, "Create failed"));
        return;
      }
      toast.success(result.message ?? "Street created");
    } else if (editingId !== null) {
      if (!form.rowVersion) {
        setSaving(false);
        toast.error("Missing row version. Close the form, open edit again, then save.");
        return;
      }
      const result = await updateStreet(editingId, {
        ...payload,
        rowVersion: form.rowVersion,
      });
      setSaving(false);
      if (!result.success) {
        toast.error(apiErrorMessage(result, "Update failed"));
        return;
      }
      toast.success(result.message ?? "Street updated");
    }

    setSheetOpen(false);
    void loadRows();
  };

  const columns = React.useMemo<ColumnDef<StreetListItem>[]>(
    () => [
      { accessorKey: "streetId", header: "ID" },
      { accessorKey: "streetName", header: "Street name" },
      { accessorKey: "areaName", header: "Area" },
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
          <h1 className="text-2xl font-semibold tracking-tight">Street control</h1>
          <p className="text-sm text-muted-foreground">Streets under areas for addresses.</p>
        </div>
        <Button onClick={openCreate} disabled={!canWrite}>
          <PlusIcon className="size-4" />
          Add street
        </Button>
      </div>

      <SettingsPermissionBanner resource="lookups" />

      <Input
        placeholder="Search streets…"
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
                  No streets found. Add an area first, then create streets.
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
        <SheetContent className="overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{sheetMode === "create" ? "Add street" : "Edit street"}</SheetTitle>
            <SheetDescription>Link the street to an area.</SheetDescription>
          </SheetHeader>

          <form id="street-form" onSubmit={onSave} className="flex flex-col gap-4 px-4">
            <div className="grid gap-2">
              <Label htmlFor="streetName">Street name</Label>
              <Input
                id="streetName"
                value={form.streetName}
                onChange={(e) => setForm((f) => ({ ...f, streetName: e.target.value }))}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="areaId">Area</Label>
              <Select
                value={form.areaId}
                onValueChange={(value) => setForm((f) => ({ ...f, areaId: value }))}
              >
                <SelectTrigger id="areaId">
                  <SelectValue placeholder="Select area" />
                </SelectTrigger>
                <SelectContent>
                  {areas.map((a) => (
                    <SelectItem key={a.areaId} value={String(a.areaId)}>
                      {a.areaName} ({a.cityName})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </form>

          <SheetFooter>
            <Button type="submit" form="street-form" disabled={saving || !canWrite}>
              {saving && <Loader2Icon className="size-4 animate-spin" />}
              Save
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
