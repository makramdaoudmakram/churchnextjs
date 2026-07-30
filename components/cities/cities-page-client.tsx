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
  createCity,
  deleteCity,
  getCity,
  listCities,
  listGovernorates,
  updateCity,
  type CityListItem,
  type GovernorateOption,
} from "@/lib/cities-api";
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
  cityName: "",
  governorateId: "",
  rowVersion: "",
};

export function CitiesPageClient() {
  const { canWrite } = useCharityWrite("lookups");

  const [rows, setRows] = React.useState<CityListItem[]>([]);
  const [totalCount, setTotalCount] = React.useState(0);
  const [pageNumber, setPageNumber] = React.useState(1);
  const [pageSize] = React.useState(10);
  const [search, setSearch] = React.useState("");
  const [searchInput, setSearchInput] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [governorates, setGovernorates] = React.useState<GovernorateOption[]>([]);

  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [sheetMode, setSheetMode] = React.useState<SheetMode>("create");
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const [form, setForm] = React.useState(emptyForm);
  const [saving, setSaving] = React.useState(false);

  const loadCities = React.useCallback(async () => {
    setLoading(true);
    const result = await listCities({ pageNumber, pageSize, search });
    setLoading(false);

    if (!result.success || !result.data) {
      toast.error(result.message ?? result.errors?.join(", ") ?? "Failed to load cities");
      setRows([]);
      setTotalCount(0);
      return;
    }

    setRows(result.data.items ?? []);
    setTotalCount(result.data.totalCount ?? 0);
  }, [pageNumber, pageSize, search]);

  React.useEffect(() => {
    void loadCities();
  }, [loadCities]);

  React.useEffect(() => {
    void (async () => {
      const result = await listGovernorates(200);
      if (result.success && result.data?.items) {
        setGovernorates(result.data.items);
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

  const openEdit = React.useCallback(async (city: CityListItem) => {
    setSheetMode("edit");
    setEditingId(city.cityId);
    setSheetOpen(true);
    setSaving(true);

    const result = await getCity(city.cityId);
    setSaving(false);

    if (!result.success || !result.data) {
      toast.error(result.message ?? "Could not load city details");
      setSheetOpen(false);
      return;
    }

    const d = result.data;
    setForm({
      cityName: d.cityName,
      governorateId: String(d.governorateId),
      rowVersion: d.rowVersion,
    });
  }, []);

  const onDelete = React.useCallback(
    async (city: CityListItem) => {
      if (!confirm(`Delete "${city.cityName}"?`)) {
        return;
      }
      const result = await deleteCity(city.cityId);
      if (!result.success) {
        toast.error(result.message ?? result.errors?.join(", ") ?? "Delete failed");
        return;
      }
      toast.success(result.message ?? "City deleted");
      void loadCities();
    },
    [loadCities]
  );

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.cityName.trim()) {
      toast.error("City name is required");
      return;
    }
    if (!form.governorateId) {
      toast.error("Governorate is required");
      return;
    }

    setSaving(true);
    const payload = {
      cityName: form.cityName.trim(),
      governorateId: Number(form.governorateId),
    };

    if (sheetMode === "create") {
      const result = await createCity(payload);
      setSaving(false);
      if (!result.success) {
        toast.error(result.message ?? result.errors?.join(", ") ?? "Create failed");
        return;
      }
      toast.success(result.message ?? "City created");
    } else if (editingId !== null) {
      const result = await updateCity(editingId, {
        ...payload,
        rowVersion: form.rowVersion,
      });
      setSaving(false);
      if (!result.success) {
        toast.error(result.message ?? result.errors?.join(", ") ?? "Update failed");
        return;
      }
      toast.success(result.message ?? "City updated");
    }

    setSheetOpen(false);
    void loadCities();
  };

  const columns = React.useMemo<ColumnDef<CityListItem>[]>(
    () => [
      { accessorKey: "cityId", header: "ID" },
      { accessorKey: "cityName", header: "City name" },
      { accessorKey: "governorateName", header: "Governorate" },
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
          <h1 className="text-2xl font-semibold tracking-tight">Cities</h1>
          <p className="text-sm text-muted-foreground">Manage cities under governorates.</p>
        </div>
        <Button onClick={openCreate} disabled={!canWrite}>
          <PlusIcon className="size-4" />
          Add city
        </Button>
      </div>

      <SettingsPermissionBanner resource="lookups" />

      <Input
        placeholder="Search cities…"
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
                  No cities found.
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
            <SheetTitle>{sheetMode === "create" ? "Add city" : "Edit city"}</SheetTitle>
            <SheetDescription>
              {sheetMode === "create"
                ? "Create a new city under a governorate."
                : "Update city details."}
            </SheetDescription>
          </SheetHeader>

          <form id="city-form" onSubmit={onSave} className="flex flex-col gap-4 px-4">
            <div className="grid gap-2">
              <Label htmlFor="cityName">City name</Label>
              <Input
                id="cityName"
                value={form.cityName}
                onChange={(e) => setForm((f) => ({ ...f, cityName: e.target.value }))}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="governorateId">Governorate</Label>
              <Select
                value={form.governorateId}
                onValueChange={(value) => setForm((f) => ({ ...f, governorateId: value }))}
              >
                <SelectTrigger id="governorateId">
                  <SelectValue placeholder="Select governorate" />
                </SelectTrigger>
                <SelectContent>
                  {governorates.map((g) => (
                    <SelectItem key={g.governorateId} value={String(g.governorateId)}>
                      {g.governorateName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </form>

          <SheetFooter>
            <Button type="submit" form="city-form" disabled={saving}>
              {saving && <Loader2Icon className="size-4 animate-spin" />}
              Save
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
