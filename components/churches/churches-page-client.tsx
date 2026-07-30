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
  createChurch,
  deleteChurch,
  getChurch,
  listAreas,
  listChurches,
  updateChurch,
  type AreaOption,
  type ChurchListItem,
} from "@/lib/churches-api";
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
  churchName: "",
  areaId: "",
  phone: "",
  rowVersion: "",
};

export function ChurchesPageClient() {
  const { canWrite } = useCharityWrite("churches");

  const [rows, setRows] = React.useState<ChurchListItem[]>([]);
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

  const loadChurches = React.useCallback(async () => {
    setLoading(true);
    const result = await listChurches({ pageNumber, pageSize, search });
    setLoading(false);

    if (!result.success || !result.data) {
      toast.error(result.message ?? result.errors?.join(", ") ?? "Failed to load churches");
      setRows([]);
      setTotalCount(0);
      return;
    }

    setRows(result.data.items ?? []);
    setTotalCount(result.data.totalCount ?? 0);
  }, [pageNumber, pageSize, search]);

  React.useEffect(() => {
    void loadChurches();
  }, [loadChurches]);

  React.useEffect(() => {
    void (async () => {
      const result = await listAreas(200);
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

  const openEdit = React.useCallback(async (church: ChurchListItem) => {
    setSheetMode("edit");
    setEditingId(church.churchId);
    setSheetOpen(true);
    setSaving(true);

    const result = await getChurch(church.churchId);
    setSaving(false);

    if (!result.success || !result.data) {
      toast.error(result.message ?? "Could not load church details");
      setSheetOpen(false);
      return;
    }

    const d = result.data;
    setForm({
      churchName: d.churchName,
      areaId: String(d.areaId),
      phone: d.phone ?? "",
      rowVersion: d.rowVersion,
    });
  }, []);

  const onDelete = React.useCallback(
    async (church: ChurchListItem) => {
      if (!confirm(`Delete "${church.churchName}"?`)) {
        return;
      }
      const result = await deleteChurch(church.churchId);
      if (!result.success) {
        toast.error(result.message ?? result.errors?.join(", ") ?? "Delete failed");
        return;
      }
      toast.success(result.message ?? "Church deleted");
      void loadChurches();
    },
    [loadChurches]
  );

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.churchName.trim()) {
      toast.error("Church name is required");
      return;
    }
    if (!form.areaId) {
      toast.error("Area is required");
      return;
    }

    setSaving(true);
    const payload = {
      churchName: form.churchName.trim(),
      areaId: Number(form.areaId),
      phone: form.phone.trim() || null,
    };

    if (sheetMode === "create") {
      const result = await createChurch(payload);
      setSaving(false);
      if (!result.success) {
        toast.error(result.message ?? result.errors?.join(", ") ?? "Create failed");
        return;
      }
      toast.success(result.message ?? "Church created");
    } else if (editingId !== null) {
      const result = await updateChurch(editingId, {
        ...payload,
        rowVersion: form.rowVersion,
      });
      setSaving(false);
      if (!result.success) {
        toast.error(result.message ?? result.errors?.join(", ") ?? "Update failed");
        return;
      }
      toast.success(result.message ?? "Church updated");
    }

    setSheetOpen(false);
    void loadChurches();
  };

  const columns = React.useMemo<ColumnDef<ChurchListItem>[]>(
    () => [
      {
        accessorKey: "churchId",
        header: "ID",
        cell: ({ row }) => row.original.churchId,
      },
      {
        accessorKey: "churchName",
        header: "Church name",
      },
      {
        accessorKey: "areaName",
        header: "Area",
      },
      {
        accessorKey: "phone",
        header: "Phone",
        cell: ({ row }) => row.original.phone ?? "—",
      },
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
          <h1 className="text-2xl font-semibold tracking-tight">Churches</h1>
          <p className="text-sm text-muted-foreground">Manage churches from the Charity API.</p>
        </div>
        <Button onClick={openCreate} disabled={!canWrite}>
          <PlusIcon className="size-4" />
          Add church
        </Button>
      </div>

      <SettingsPermissionBanner resource="churches" />

      <div className="flex items-center gap-2">
        <Input
          placeholder="Search churches…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="max-w-sm"
        />
      </div>

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
                  No churches found.
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
            <SheetTitle>{sheetMode === "create" ? "Add church" : "Edit church"}</SheetTitle>
            <SheetDescription>
              {sheetMode === "create"
                ? "Create a new church record."
                : "Update church details and save."}
            </SheetDescription>
          </SheetHeader>

          <form id="church-form" onSubmit={onSave} className="flex flex-col gap-4 px-4">
            <div className="grid gap-2">
              <Label htmlFor="churchName">Church name</Label>
              <Input
                id="churchName"
                value={form.churchName}
                onChange={(e) => setForm((f) => ({ ...f, churchName: e.target.value }))}
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
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>
          </form>

          <SheetFooter>
            <Button type="submit" form="church-form" disabled={saving}>
              {saving && <Loader2Icon className="size-4 animate-spin" />}
              Save
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
