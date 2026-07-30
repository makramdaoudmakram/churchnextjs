"use client";

import * as React from "react";
import { Loader2Icon, PlusIcon, Trash2Icon, PencilIcon } from "lucide-react";
import { toast } from "sonner";
import { useCharityWrite } from "@/hooks/use-charity-write";
import { SettingsPermissionBanner } from "@/components/settings-permission-banner";
import { apiErrorMessage, normalizeRowVersion } from "@/lib/api-form-utils";
import {
  createLookup,
  deleteLookup,
  getLookup,
  listLookups,
  updateLookup,
  type LookupListItem,
  type LookupTypeName,
} from "@/lib/lookups-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const lookupType = "RelationshipType" as const satisfies LookupTypeName;

export function LookupsPageClient() {
  const { canWrite } = useCharityWrite("lookups");
  const [rows, setRows] = React.useState<LookupListItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const [name, setName] = React.useState("");
  const [rowVersion, setRowVersion] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    const result = await listLookups(lookupType, { pageNumber: 1, pageSize: 200 });
    setLoading(false);
    if (!result.success || !result.data) {
      toast.error(apiErrorMessage(result, "Failed to load"));
      setRows([]);
      return;
    }
    setRows(result.data.items ?? []);
  }, [lookupType]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEditingId(null);
    setName("");
    setRowVersion("");
    setSheetOpen(true);
  };

  const openEdit = async (row: LookupListItem) => {
    setEditingId(row.id);
    setSheetOpen(true);
    setSaving(true);
    const result = await getLookup(lookupType, row.id);
    setSaving(false);
    if (!result.success || !result.data) {
      toast.error(apiErrorMessage(result, "Load failed"));
      setSheetOpen(false);
      return;
    }
    setName(result.data.name);
    setRowVersion(normalizeRowVersion(result.data.rowVersion));
  };

  const onDelete = async (row: LookupListItem) => {
    if (!confirm(`Delete "${row.name}"?`)) return;
    const result = await deleteLookup(lookupType, row.id);
    if (!result.success) {
      toast.error(apiErrorMessage(result, "Delete failed"));
      return;
    }
    toast.success(result.message ?? "Deleted");
    void load();
  };

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    if (editingId === null) {
      const result = await createLookup(lookupType, { name: name.trim(), isActive: true });
      setSaving(false);
      if (!result.success) {
        toast.error(apiErrorMessage(result, "Create failed"));
        return;
      }
    } else {
      if (!rowVersion) {
        setSaving(false);
        toast.error("Missing row version");
        return;
      }
      const result = await updateLookup(lookupType, editingId, {
        name: name.trim(),
        isActive: true,
        rowVersion,
      });
      setSaving(false);
      if (!result.success) {
        toast.error(apiErrorMessage(result, "Update failed"));
        return;
      }
    }
    setSheetOpen(false);
    void load();
  };

  return (
    <div className="flex flex-col gap-4 px-4 lg:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Relationship lookups</h1>
          <p className="text-sm text-muted-foreground">Relationship types for family members (children). Education, job, and marital status have their own settings pages.</p>
        </div>
        <Button onClick={openCreate} disabled={!canWrite}>
          <PlusIcon className="size-4" /> Add
        </Button>
      </div>
      <SettingsPermissionBanner resource="lookups" />
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={3} className="h-20 text-center">
                  <Loader2Icon className="mx-auto animate-spin" />
                </TableCell>
              </TableRow>
            ) : rows.length ? (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.id}</TableCell>
                  <TableCell>{row.name}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon-sm" disabled={!canWrite} onClick={() => void openEdit(row)}>
                      <PencilIcon className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" className="text-destructive" disabled={!canWrite} onClick={() => void onDelete(row)}>
                      <Trash2Icon className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  No items — add one for applications.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{editingId === null ? "Add lookup" : "Edit lookup"}</SheetTitle>
          </SheetHeader>
          <form onSubmit={onSave} className="flex flex-col gap-4 px-4">
            <div className="grid gap-2">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
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
