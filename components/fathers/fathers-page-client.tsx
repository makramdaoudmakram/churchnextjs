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
  createFather,
  deleteFather,
  getFather,
  listChurchesForFatherSelect,
  listFathers,
  updateFather,
  type ChurchOption,
  type FatherListItem,
} from "@/lib/fathers-api";
import { apiErrorMessage, normalizeRowVersion } from "@/lib/api-form-utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  fatherName: "",
  churchId: "",
  mobile: "",
  notes: "",
  isActive: true,
  rowVersion: "",
};

export function FathersPageClient() {
  const { canWrite } = useCharityWrite("churches");

  const [rows, setRows] = React.useState<FatherListItem[]>([]);
  const [totalCount, setTotalCount] = React.useState(0);
  const [pageNumber, setPageNumber] = React.useState(1);
  const [pageSize] = React.useState(10);
  const [search, setSearch] = React.useState("");
  const [searchInput, setSearchInput] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [churches, setChurches] = React.useState<ChurchOption[]>([]);

  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [sheetMode, setSheetMode] = React.useState<SheetMode>("create");
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const [form, setForm] = React.useState(emptyForm);
  const [saving, setSaving] = React.useState(false);

  const loadRows = React.useCallback(async () => {
    setLoading(true);
    const result = await listFathers({ pageNumber, pageSize, search });
    setLoading(false);

    if (!result.success || !result.data) {
      toast.error(result.message ?? result.errors?.join(", ") ?? "Failed to load fathers");
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
      const result = await listChurchesForFatherSelect(300);
      if (result.success && result.data?.items) {
        setChurches(result.data.items);
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

  const openEdit = React.useCallback(async (row: FatherListItem) => {
    setSheetMode("edit");
    setEditingId(row.fatherOfConfessionId);
    setSheetOpen(true);
    setSaving(true);

    const result = await getFather(row.fatherOfConfessionId);
    setSaving(false);

    if (!result.success || !result.data) {
      toast.error(result.message ?? "Could not load father details");
      setSheetOpen(false);
      return;
    }

    const d = result.data;
    setForm({
      fatherName: d.fatherName,
      churchId: String(d.churchId),
      mobile: d.mobile ?? "",
      notes: d.notes ?? "",
      isActive: d.isActive,
      rowVersion: normalizeRowVersion(d.rowVersion),
    });
  }, []);

  const onDelete = React.useCallback(
    async (row: FatherListItem) => {
      if (!confirm(`Delete "${row.fatherName}"?`)) return;
      const result = await deleteFather(row.fatherOfConfessionId);
      if (!result.success) {
        toast.error(result.message ?? result.errors?.join(", ") ?? "Delete failed");
        return;
      }
      toast.success(result.message ?? "Deleted");
      void loadRows();
    },
    [loadRows]
  );

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fatherName.trim()) {
      toast.error("Father name is required");
      return;
    }
    if (!form.churchId) {
      toast.error("Church is required");
      return;
    }

    setSaving(true);
    const payload = {
      fatherName: form.fatherName.trim(),
      churchId: Number(form.churchId),
      mobile: form.mobile.trim() || null,
      notes: form.notes.trim() || null,
      isActive: form.isActive,
    };

    if (sheetMode === "create") {
      const result = await createFather(payload);
      setSaving(false);
      if (!result.success) {
        toast.error(apiErrorMessage(result, "Create failed"));
        return;
      }
      toast.success(result.message ?? "Father created");
    } else if (editingId !== null) {
      if (!form.rowVersion) {
        setSaving(false);
        toast.error("Missing row version. Close the form, open edit again, then save.");
        return;
      }
      const result = await updateFather(editingId, {
        ...payload,
        rowVersion: form.rowVersion,
      });
      setSaving(false);
      if (!result.success) {
        toast.error(apiErrorMessage(result, "Update failed"));
        return;
      }
      toast.success(result.message ?? "Father updated");
    }

    setSheetOpen(false);
    void loadRows();
  };

  const columns = React.useMemo<ColumnDef<FatherListItem>[]>(
    () => [
      { accessorKey: "fatherOfConfessionId", header: "ID" },
      { accessorKey: "fatherName", header: "Name" },
      { accessorKey: "churchName", header: "Church" },
      {
        accessorKey: "mobile",
        header: "Mobile",
        cell: ({ row }) => row.original.mobile ?? "—",
      },
      {
        accessorKey: "isActive",
        header: "Active",
        cell: ({ row }) => (row.original.isActive ? "Yes" : "No"),
      },
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
          <h1 className="text-2xl font-semibold tracking-tight">Father control</h1>
          <p className="text-sm text-muted-foreground">Fathers of confession linked to churches.</p>
        </div>
        <Button onClick={openCreate} disabled={!canWrite}>
          <PlusIcon className="size-4" />
          Add father
        </Button>
      </div>

      <SettingsPermissionBanner resource="churches" />

      <Input
        placeholder="Search by name…"
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
                  No records found.
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
            <SheetTitle>{sheetMode === "create" ? "Add father" : "Edit father"}</SheetTitle>
            <SheetDescription>Assign a father of confession to a church.</SheetDescription>
          </SheetHeader>

          <form id="father-form" onSubmit={onSave} className="flex flex-col gap-4 px-4">
            <div className="grid gap-2">
              <Label htmlFor="fatherName">Name</Label>
              <Input
                id="fatherName"
                value={form.fatherName}
                onChange={(e) => setForm((f) => ({ ...f, fatherName: e.target.value }))}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="churchId">Church</Label>
              <Select
                value={form.churchId}
                onValueChange={(value) => setForm((f) => ({ ...f, churchId: value }))}
              >
                <SelectTrigger id="churchId">
                  <SelectValue placeholder="Select church" />
                </SelectTrigger>
                <SelectContent>
                  {churches.map((c) => (
                    <SelectItem key={c.churchId} value={String(c.churchId)}>
                      {c.churchName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="mobile">Mobile</Label>
              <Input
                id="mobile"
                placeholder="Optional — 7–20 digits"
                value={form.mobile}
                onChange={(e) => setForm((f) => ({ ...f, mobile: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="isActive"
                checked={form.isActive}
                onCheckedChange={(checked) =>
                  setForm((f) => ({ ...f, isActive: checked === true }))
                }
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
          </form>

          <SheetFooter>
            <Button type="submit" form="father-form" disabled={saving}>
              {saving && <Loader2Icon className="size-4 animate-spin" />}
              Save
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
