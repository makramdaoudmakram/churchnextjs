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
  createArea,
  deleteArea,
  getArea,
  listAreas,
  listCities,
  updateArea,
  type AreaListItem,
  type CityOption,
} from "@/lib/areas-api";
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
  areaName: "",
  cityId: "",
  rowVersion: "",
};

export function AreasPageClient() {
  const { canWrite } = useCharityWrite("lookups");

  const [rows, setRows] = React.useState<AreaListItem[]>([]);
  const [totalCount, setTotalCount] = React.useState(0);
  const [pageNumber, setPageNumber] = React.useState(1);
  const [pageSize] = React.useState(10);
  const [search, setSearch] = React.useState("");
  const [searchInput, setSearchInput] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [cities, setCities] = React.useState<CityOption[]>([]);

  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [sheetMode, setSheetMode] = React.useState<SheetMode>("create");
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const [form, setForm] = React.useState(emptyForm);
  const [saving, setSaving] = React.useState(false);

  const loadAreas = React.useCallback(async () => {
    setLoading(true);
    const result = await listAreas({ pageNumber, pageSize, search });
    setLoading(false);

    if (!result.success || !result.data) {
      toast.error(result.message ?? result.errors?.join(", ") ?? "Failed to load areas");
      setRows([]);
      setTotalCount(0);
      return;
    }

    setRows(result.data.items ?? []);
    setTotalCount(result.data.totalCount ?? 0);
  }, [pageNumber, pageSize, search]);

  React.useEffect(() => {
    void loadAreas();
  }, [loadAreas]);

  React.useEffect(() => {
    void (async () => {
      const result = await listCities(200);
      if (result.success && result.data?.items) {
        setCities(result.data.items);
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

  const openEdit = React.useCallback(async (area: AreaListItem) => {
    setSheetMode("edit");
    setEditingId(area.areaId);
    setSheetOpen(true);
    setSaving(true);

    const result = await getArea(area.areaId);
    setSaving(false);

    if (!result.success || !result.data) {
      toast.error(result.message ?? "Could not load area details");
      setSheetOpen(false);
      return;
    }

    const d = result.data;
    setForm({
      areaName: d.areaName,
      cityId: String(d.cityId),
      rowVersion: d.rowVersion,
    });
  }, []);

  const onDelete = React.useCallback(
    async (area: AreaListItem) => {
      if (!confirm(`Delete "${area.areaName}"?`)) {
        return;
      }
      const result = await deleteArea(area.areaId);
      if (!result.success) {
        toast.error(result.message ?? result.errors?.join(", ") ?? "Delete failed");
        return;
      }
      toast.success(result.message ?? "Area deleted");
      void loadAreas();
    },
    [loadAreas]
  );

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.areaName.trim()) {
      toast.error("Area name is required");
      return;
    }
    if (!form.cityId) {
      toast.error("City is required");
      return;
    }

    setSaving(true);
    const payload = {
      areaName: form.areaName.trim(),
      cityId: Number(form.cityId),
    };

    if (sheetMode === "create") {
      const result = await createArea(payload);
      setSaving(false);
      if (!result.success) {
        toast.error(result.message ?? result.errors?.join(", ") ?? "Create failed");
        return;
      }
      toast.success(result.message ?? "Area created");
    } else if (editingId !== null) {
      const result = await updateArea(editingId, {
        ...payload,
        rowVersion: form.rowVersion,
      });
      setSaving(false);
      if (!result.success) {
        toast.error(result.message ?? result.errors?.join(", ") ?? "Update failed");
        return;
      }
      toast.success(result.message ?? "Area updated");
    }

    setSheetOpen(false);
    void loadAreas();
  };

  const columns = React.useMemo<ColumnDef<AreaListItem>[]>(
    () => [
      { accessorKey: "areaId", header: "ID" },
      { accessorKey: "areaName", header: "Area name" },
      { accessorKey: "cityName", header: "City" },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="icon-sm" disabled={!canWrite} onClick={() => void openEdit(row.original)}>
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
          <h1 className="text-2xl font-semibold tracking-tight">Areas</h1>
          <p className="text-sm text-muted-foreground">Manage areas (districts) under cities.</p>
        </div>
        <Button onClick={openCreate} disabled={!canWrite}>
          <PlusIcon className="size-4" />
          Add area
        </Button>
      </div>

      <SettingsPermissionBanner resource="lookups" />

      <Input
        placeholder="Search areas…"
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
                  No areas found.
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
            <SheetTitle>{sheetMode === "create" ? "Add area" : "Edit area"}</SheetTitle>
            <SheetDescription>
              {sheetMode === "create" ? "Create a new area under a city." : "Update area details."}
            </SheetDescription>
          </SheetHeader>

          <form id="area-form" onSubmit={onSave} className="flex flex-col gap-4 px-4">
            <div className="grid gap-2">
              <Label htmlFor="areaName">Area name</Label>
              <Input
                id="areaName"
                value={form.areaName}
                onChange={(e) => setForm((f) => ({ ...f, areaName: e.target.value }))}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cityId">City</Label>
              <Select
                value={form.cityId}
                onValueChange={(value) => setForm((f) => ({ ...f, cityId: value }))}
              >
                <SelectTrigger id="cityId">
                  <SelectValue placeholder="Select city" />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((c) => (
                    <SelectItem key={c.cityId} value={String(c.cityId)}>
                      {c.cityName} ({c.governorateName})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </form>

          <SheetFooter>
            <Button type="submit" form="area-form" disabled={saving}>
              {saving && <Loader2Icon className="size-4 animate-spin" />}
              Save
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
