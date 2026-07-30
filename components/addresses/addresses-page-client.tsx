"use client";

import * as React from "react";
import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from "@tanstack/react-table";
import { Loader2Icon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { useCharityWrite } from "@/hooks/use-charity-write";
import { SettingsPermissionBanner } from "@/components/settings-permission-banner";
import { apiErrorMessage, normalizeRowVersion } from "@/lib/api-form-utils";
import {
  createAddress,
  deleteAddress,
  getAddress,
  listAddresses,
  listAreasForAddress,
  listStreetsForAddress,
  updateAddress,
  type AddressListItem,
  type AreaOption,
  type StreetOption,
} from "@/lib/addresses-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const emptyForm = {
  streetId: "",
  areaId: "",
  buildingNo: "",
  floorNo: "",
  apartmentNo: "",
  landmark: "",
  postalCode: "",
  rowVersion: "",
};

export function AddressesPageClient() {
  const { canWrite } = useCharityWrite("addresses");
  const [rows, setRows] = React.useState<AddressListItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [streets, setStreets] = React.useState<StreetOption[]>([]);
  const [areas, setAreas] = React.useState<AreaOption[]>([]);
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const [form, setForm] = React.useState(emptyForm);
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    const result = await listAddresses({ pageNumber: 1, pageSize: 50 });
    setLoading(false);
    if (!result.success || !result.data) {
      setRows([]);
      return;
    }
    setRows(result.data.items ?? []);
  }, []);

  React.useEffect(() => {
    void load();
    void (async () => {
      const [s, a] = await Promise.all([listStreetsForAddress(), listAreasForAddress()]);
      if (s.success && s.data?.items) setStreets(s.data.items);
      if (a.success && a.data?.items) setAreas(a.data.items);
    })();
  }, [load]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setSheetOpen(true);
  };

  const openEdit = async (row: AddressListItem) => {
    setEditingId(row.addressId);
    setSheetOpen(true);
    setSaving(true);
    const result = await getAddress(row.addressId);
    setSaving(false);
    if (!result.success || !result.data) {
      toast.error(apiErrorMessage(result, "Load failed"));
      setSheetOpen(false);
      return;
    }
    const d = result.data;
    setForm({
      streetId: String(d.streetId),
      areaId: String(d.areaId),
      buildingNo: d.buildingNo ?? "",
      floorNo: d.floorNo ?? "",
      apartmentNo: d.apartmentNo ?? "",
      landmark: d.landmark ?? "",
      postalCode: d.postalCode ?? "",
      rowVersion: normalizeRowVersion(d.rowVersion),
    });
  };

  const onDelete = async (row: AddressListItem) => {
    if (!confirm(`Delete address #${row.addressId}?`)) return;
    const result = await deleteAddress(row.addressId);
    if (!result.success) {
      toast.error(apiErrorMessage(result, "Delete failed"));
      return;
    }
    toast.success(result.message ?? "Deleted");
    void load();
  };

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.streetId || !form.areaId) {
      toast.error("Street and area are required");
      return;
    }
    const payload = {
      streetId: Number(form.streetId),
      areaId: Number(form.areaId),
      buildingNo: form.buildingNo.trim() || null,
      floorNo: form.floorNo.trim() || null,
      apartmentNo: form.apartmentNo.trim() || null,
      landmark: form.landmark.trim() || null,
      postalCode: form.postalCode.trim() || null,
    };
    setSaving(true);
    if (editingId === null) {
      const result = await createAddress(payload);
      setSaving(false);
      if (!result.success) {
        toast.error(apiErrorMessage(result, "Create failed"));
        return;
      }
    } else {
      if (!form.rowVersion) {
        setSaving(false);
        toast.error("Missing row version");
        return;
      }
      const result = await updateAddress(editingId, { ...payload, rowVersion: form.rowVersion });
      setSaving(false);
      if (!result.success) {
        toast.error(apiErrorMessage(result, "Update failed"));
        return;
      }
    }
    setSheetOpen(false);
    void load();
  };

  const columns = React.useMemo<ColumnDef<AddressListItem>[]>(
    () => [
      { accessorKey: "addressId", header: "ID" },
      { accessorKey: "streetName", header: "Street" },
      { accessorKey: "areaName", header: "Area" },
      { accessorKey: "buildingNo", header: "Building" },
      {
        id: "actions",
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="icon-sm" disabled={!canWrite} onClick={() => void openEdit(row.original)}>
              <PencilIcon className="size-4" />
            </Button>
            <Button variant="ghost" size="icon-sm" className="text-destructive" disabled={!canWrite} onClick={() => void onDelete(row.original)}>
              <Trash2Icon className="size-4" />
            </Button>
          </div>
        ),
      },
    ],
    [canWrite]
  );

  const table = useReactTable({ data: rows, columns, getCoreRowModel: getCoreRowModel() });

  return (
    <div className="flex flex-col gap-4 px-4 lg:px-6">
      <div className="flex justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Address control</h1>
          <p className="text-sm text-muted-foreground">Required before linking an application.</p>
        </div>
        <Button onClick={openCreate} disabled={!canWrite}>
          <PlusIcon className="size-4" /> Add address
        </Button>
      </div>
      <SettingsPermissionBanner resource="addresses" />
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead key={h.id}>{flexRender(h.column.columnDef.header, h.getContext())}</TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-20 text-center">
                  <Loader2Icon className="mx-auto animate-spin" />
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{editingId === null ? "Add address" : "Edit address"}</SheetTitle>
          </SheetHeader>
          <form onSubmit={onSave} className="flex flex-col gap-3 px-4">
            <Label>Street</Label>
            <Select value={form.streetId} onValueChange={(v) => setForm((f) => ({ ...f, streetId: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Street" />
              </SelectTrigger>
              <SelectContent>
                {streets.map((s) => (
                  <SelectItem key={s.streetId} value={String(s.streetId)}>
                    {s.streetName} ({s.areaName})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Label>Area</Label>
            <Select value={form.areaId} onValueChange={(v) => setForm((f) => ({ ...f, areaId: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Area" />
              </SelectTrigger>
              <SelectContent>
                {areas.map((a) => (
                  <SelectItem key={a.areaId} value={String(a.areaId)}>
                    {a.areaName} ({a.cityName})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Label>Building no.</Label>
            <Input value={form.buildingNo} onChange={(e) => setForm((f) => ({ ...f, buildingNo: e.target.value }))} />
            <SheetFooter>
              <Button type="submit" disabled={saving || !canWrite}>
                Save
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
