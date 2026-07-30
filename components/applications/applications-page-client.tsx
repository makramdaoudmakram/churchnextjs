"use client";

import * as React from "react";
import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from "@tanstack/react-table";
import { Loader2Icon, MoreHorizontalIcon, PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { useCharityWrite } from "@/hooks/use-charity-write";
import { SettingsPermissionBanner } from "@/components/settings-permission-banner";
import { apiErrorMessage, normalizeRowVersion } from "@/lib/api-form-utils";
import {
  createApplicant,
  deleteApplicant,
  getApplicant,
  listApplicants,
  updateApplicant,
  type ApplicantListItem,
} from "@/lib/applicants-api";
import Link from "next/link";
import { listAddressesForSelect } from "@/lib/addresses-api";
import { listLookupResourceForSelect } from "@/lib/lookup-resource-api";
import { listFathers } from "@/lib/fathers-api";
import { listSupervisorsForSelect } from "@/lib/supervisors-api";
import { ChildControlContainer } from "@/components/applications/child-control-container";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type SheetMode = "create" | "edit";

const emptyForm = {
  fullName: "",
  nationalId: "",
  mobile: "",
  birthDate: "",
  salary: "0",
  healthStatus: "",
  anotherSourceInc: "",
  houseDescrip: "",
  otherPersonHou: "",
  serReport: "",
  educationLevelId: "",
  jobTitleId: "",
  maritalStatusId: "",
  fatherOfConfessionId: "",
  supervisorId: "",
  addressId: "",
  rowVersion: "",
};

function formatDateInput(iso: string) {
  try {
    return new Date(iso).toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

export function ApplicationsPageClient() {
  const { canWrite } = useCharityWrite("applicants");
  const [rows, setRows] = React.useState<ApplicantListItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchInput, setSearchInput] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [sheetMode, setSheetMode] = React.useState<SheetMode>("create");
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const [form, setForm] = React.useState(emptyForm);
  const [formLoading, setFormLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const [childOpen, setChildOpen] = React.useState(false);
  const [childApplicant, setChildApplicant] = React.useState<{ id: number; name: string } | null>(null);

  const [education, setEducation] = React.useState<{ id: number; name: string }[]>([]);
  const [jobs, setJobs] = React.useState<{ id: number; name: string }[]>([]);
  const [marital, setMarital] = React.useState<{ id: number; name: string }[]>([]);
  const [fathers, setFathers] = React.useState<{ id: number; name: string }[]>([]);
  const [supervisors, setSupervisors] = React.useState<{ id: number; name: string }[]>([]);
  const [addresses, setAddresses] = React.useState<{ id: number; label: string }[]>([]);
  const [optionsLoading, setOptionsLoading] = React.useState(false);

  const loadApplicationOptions = React.useCallback(async () => {
    setOptionsLoading(true);
    const [e, j, m, f, s, a] = await Promise.all([
      listLookupResourceForSelect("education-levels"),
      listLookupResourceForSelect("job-titles"),
      listLookupResourceForSelect("marital-statuses"),
      listFathers({ pageNumber: 1, pageSize: 200 }),
      listSupervisorsForSelect(),
      listAddressesForSelect(),
    ]);
    setOptionsLoading(false);
    if (e.success && e.data?.items) setEducation(e.data.items.map((x) => ({ id: x.id, name: x.name })));
    else setEducation([]);
    if (j.success && j.data?.items) setJobs(j.data.items.map((x) => ({ id: x.id, name: x.name })));
    else setJobs([]);
    if (m.success && m.data?.items) setMarital(m.data.items.map((x) => ({ id: x.id, name: x.name })));
    else setMarital([]);
    if (f.success && f.data?.items)
      setFathers(f.data.items.map((x) => ({ id: x.fatherOfConfessionId, name: x.fatherName })));
    else setFathers([]);
    if (s.success && s.data?.items)
      setSupervisors(s.data.items.map((x) => ({ id: x.supervisorId, name: x.name })));
    else setSupervisors([]);
    if (a.success && a.data?.items)
      setAddresses(
        a.data.items.map((x) => ({
          id: x.addressId,
          label: `#${x.addressId} ${x.streetName}, ${x.areaName}`,
        }))
      );
    else setAddresses([]);
  }, []);

  const loadRows = React.useCallback(async () => {
    setLoading(true);
    const result = await listApplicants({ pageNumber: 1, pageSize: 50, search });
    setLoading(false);
    if (!result.success || !result.data) {
      toast.error(apiErrorMessage(result, "Failed to load applications"));
      setRows([]);
      return;
    }
    setRows(result.data.items ?? []);
  }, [search]);

  React.useEffect(() => {
    void loadRows();
  }, [loadRows]);

  React.useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  React.useEffect(() => {
    if (!sheetOpen) return;
    void loadApplicationOptions();
  }, [sheetOpen, loadApplicationOptions]);

  const openCreate = () => {
    setSheetMode("create");
    setEditingId(null);
    setForm(emptyForm);
    setFormLoading(false);
    setSheetOpen(true);
  };

  const openEdit = React.useCallback(async (row: ApplicantListItem) => {
    setSheetMode("edit");
    setEditingId(row.applicantId);
    setForm(emptyForm);
    setFormLoading(true);
    setSheetOpen(true);
    const result = await getApplicant(row.applicantId);
    setFormLoading(false);
    if (!result.success || !result.data) {
      toast.error(apiErrorMessage(result, "Load failed"));
      setSheetOpen(false);
      return;
    }
    const d = result.data;
    setForm({
      fullName: d.fullName,
      nationalId: d.nationalId,
      mobile: d.mobile,
      birthDate: formatDateInput(d.birthDate),
      salary: String(d.salary),
      healthStatus: d.healthStatus ?? "",
      anotherSourceInc: d.anotherSourceInc ?? "",
      houseDescrip: d.houseDescrip ?? "",
      otherPersonHou: d.otherPersonHou ?? "",
      serReport: d.serReport ?? "",
      educationLevelId: d.educationLevel ? String(d.educationLevel.id) : "",
      jobTitleId: d.jobTitle ? String(d.jobTitle.id) : "",
      maritalStatusId: d.maritalStatus ? String(d.maritalStatus.id) : "",
      fatherOfConfessionId: d.fatherOfConfession ? String(d.fatherOfConfession.fatherOfConfessionId) : "",
      supervisorId: d.supervisor ? String(d.supervisor.supervisorId) : "",
      addressId: d.address ? String(d.address.addressId) : "",
      rowVersion: normalizeRowVersion(d.rowVersion),
    });
  }, []);

  const onDelete = React.useCallback(
    async (row: ApplicantListItem) => {
      if (!confirm(`Delete application for "${row.fullName}"?`)) return;
      const result = await deleteApplicant(row.applicantId);
      if (!result.success) {
        toast.error(apiErrorMessage(result, "Delete failed"));
        return;
      }
      toast.success(result.message ?? "Deleted");
      void loadRows();
    },
    [loadRows]
  );

  const openAddChild = React.useCallback((row: ApplicantListItem) => {
    setChildApplicant({ id: row.applicantId, name: row.fullName });
    setChildOpen(true);
  }, []);

  const buildPayload = () => ({
    fullName: form.fullName.trim(),
    nationalId: form.nationalId.trim(),
    mobile: form.mobile.trim(),
    birthDate: form.birthDate ? new Date(form.birthDate).toISOString() : new Date().toISOString(),
    salary: Number(form.salary) || 0,
    healthStatus: form.healthStatus.trim() || null,
    anotherSourceInc: form.anotherSourceInc.trim() || null,
    houseDescrip: form.houseDescrip.trim() || null,
    otherPersonHou: form.otherPersonHou.trim() || null,
    serReport: form.serReport.trim() || null,
    educationLevelId: Number(form.educationLevelId),
    jobTitleId: Number(form.jobTitleId),
    maritalStatusId: Number(form.maritalStatusId),
    fatherOfConfessionId: Number(form.fatherOfConfessionId),
    supervisorId: Number(form.supervisorId),
    addressId: Number(form.addressId),
  });

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim() || form.nationalId.length !== 14) {
      toast.error("Full name and 14-digit national ID are required");
      return;
    }
    if (!form.educationLevelId || !form.jobTitleId || !form.maritalStatusId || !form.fatherOfConfessionId || !form.supervisorId || !form.addressId) {
      toast.error("Fill all lookups, supervisor, father, and address (create them in Settings first)");
      return;
    }
    setSaving(true);
    if (sheetMode === "create") {
      const result = await createApplicant(buildPayload());
      setSaving(false);
      if (!result.success) {
        toast.error(apiErrorMessage(result, "Create failed"));
        return;
      }
      toast.success(result.message ?? "Application created");
    } else if (editingId !== null) {
      if (!form.rowVersion) {
        setSaving(false);
        toast.error("Missing row version");
        return;
      }
      const result = await updateApplicant(editingId, { ...buildPayload(), rowVersion: form.rowVersion });
      setSaving(false);
      if (!result.success) {
        toast.error(apiErrorMessage(result, "Update failed"));
        return;
      }
      toast.success(result.message ?? "Application updated");
    }
    setSheetOpen(false);
    void loadRows();
  };

  const columns = React.useMemo<ColumnDef<ApplicantListItem>[]>(
    () => [
      { accessorKey: "applicantId", header: "ID" },
      { accessorKey: "fullName", header: "Name" },
      { accessorKey: "nationalId", header: "National ID" },
      { accessorKey: "mobile", header: "Mobile" },
      { accessorKey: "supervisorName", header: "Supervisor" },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm">
                <MoreHorizontalIcon className="size-4" />
                <span className="sr-only">Row actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem disabled={!canWrite} onClick={() => void openEdit(row.original)}>
                Update
              </DropdownMenuItem>
              <DropdownMenuItem disabled={!canWrite} onClick={() => openAddChild(row.original)}>
                Add child
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                disabled={!canWrite}
                onClick={() => void onDelete(row.original)}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [canWrite, openEdit, onDelete, openAddChild]
  );

  const table = useReactTable({ data: rows, columns, getCoreRowModel: getCoreRowModel() });

  return (
    <>
      <div className="flex flex-col gap-4 px-4 lg:px-6">
        <div className="flex justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Application control</h1>
            <p className="text-sm text-muted-foreground">Charity applications (applicants).</p>
          </div>
          <Button onClick={openCreate} disabled={!canWrite}>
            <PlusIcon className="size-4" /> Add application
          </Button>
        </div>
        <SettingsPermissionBanner resource="applicants" />
        <Input placeholder="Search name, ID, mobile…" className="max-w-sm" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
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
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    <Loader2Icon className="mx-auto animate-spin" />
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="text-center text-muted-foreground">
                    No applications yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="flex h-full w-[min(100vw,56rem)] max-w-[min(100vw,56rem)] flex-col overflow-y-auto sm:max-w-[min(100vw,56rem)]">
          <SheetHeader>
            <SheetTitle>{sheetMode === "create" ? "Add application" : "Update application"}</SheetTitle>
            <SheetDescription>
              Personal data, lookups, and health / house notes. Text fields are optional except where marked required.
            </SheetDescription>
          </SheetHeader>
          {formLoading ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
              <Loader2Icon className="size-8 animate-spin" />
              <p className="text-sm">Loading application…</p>
            </div>
          ) : (
          <form onSubmit={onSave} className="flex flex-col gap-3 px-4 pb-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Personal</p>
            <Label>Full name</Label>
            <Input value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} required />
            <Label>National ID (14 digits)</Label>
            <Input value={form.nationalId} maxLength={14} onChange={(e) => setForm((f) => ({ ...f, nationalId: e.target.value }))} required />
            <Label>Mobile</Label>
            <Input value={form.mobile} onChange={(e) => setForm((f) => ({ ...f, mobile: e.target.value }))} required />
            <Label>Birth date</Label>
            <Input type="date" value={form.birthDate} onChange={(e) => setForm((f) => ({ ...f, birthDate: e.target.value }))} required />
            <Label>Salary</Label>
            <Input type="number" min={0} value={form.salary} onChange={(e) => setForm((f) => ({ ...f, salary: e.target.value }))} />

            <p className="pt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Assignments</p>
            {optionsLoading ? (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Loader2Icon className="size-4 animate-spin" /> Loading form options…
              </p>
            ) : null}
            {!optionsLoading && supervisors.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No supervisors — add them in{" "}
                <Link href="/dashboard/settings/supervisors" className="text-primary underline">
                  Settings → Supervisors
                </Link>
                .
              </p>
            ) : null}
            <Label>Supervisor</Label>
            <Select value={form.supervisorId} onValueChange={(v) => setForm((f) => ({ ...f, supervisorId: v }))}>
              <SelectTrigger><SelectValue placeholder="Supervisor" /></SelectTrigger>
              <SelectContent>{supervisors.map((x) => <SelectItem key={x.id} value={String(x.id)}>{x.name}</SelectItem>)}</SelectContent>
            </Select>
            {!optionsLoading && education.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No education levels —{" "}
                <Link href="/dashboard/settings/education" className="text-primary underline">Settings → Education</Link>.
              </p>
            ) : null}
            <Label>Education</Label>
            <Select value={form.educationLevelId} onValueChange={(v) => setForm((f) => ({ ...f, educationLevelId: v }))}>
              <SelectTrigger><SelectValue placeholder="Education" /></SelectTrigger>
              <SelectContent>{education.map((x) => <SelectItem key={x.id} value={String(x.id)}>{x.name}</SelectItem>)}</SelectContent>
            </Select>
            {!optionsLoading && jobs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No job titles —{" "}
                <Link href="/dashboard/settings/job-titles" className="text-primary underline">Settings → Job titles</Link>.
              </p>
            ) : null}
            <Label>Job title</Label>
            <Select value={form.jobTitleId} onValueChange={(v) => setForm((f) => ({ ...f, jobTitleId: v }))}>
              <SelectTrigger><SelectValue placeholder="Job" /></SelectTrigger>
              <SelectContent>{jobs.map((x) => <SelectItem key={x.id} value={String(x.id)}>{x.name}</SelectItem>)}</SelectContent>
            </Select>
            {!optionsLoading && marital.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No marital statuses —{" "}
                <Link href="/dashboard/settings/marital-status" className="text-primary underline">Settings → Marital status</Link>.
              </p>
            ) : null}
            <Label>Marital status</Label>
            <Select value={form.maritalStatusId} onValueChange={(v) => setForm((f) => ({ ...f, maritalStatusId: v }))}>
              <SelectTrigger><SelectValue placeholder="Marital" /></SelectTrigger>
              <SelectContent>{marital.map((x) => <SelectItem key={x.id} value={String(x.id)}>{x.name}</SelectItem>)}</SelectContent>
            </Select>
            <Label>Father of confession</Label>
            <Select value={form.fatherOfConfessionId} onValueChange={(v) => setForm((f) => ({ ...f, fatherOfConfessionId: v }))}>
              <SelectTrigger><SelectValue placeholder="Father" /></SelectTrigger>
              <SelectContent>{fathers.map((x) => <SelectItem key={x.id} value={String(x.id)}>{x.name}</SelectItem>)}</SelectContent>
            </Select>
            <Label>Address</Label>
            <Select value={form.addressId} onValueChange={(v) => setForm((f) => ({ ...f, addressId: v }))}>
              <SelectTrigger><SelectValue placeholder="Address" /></SelectTrigger>
              <SelectContent>{addresses.map((x) => <SelectItem key={x.id} value={String(x.id)}>{x.label}</SelectItem>)}</SelectContent>
            </Select>

            <p className="pt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Health &amp; reports</p>
            <Label htmlFor="healthStatus">Health status</Label>
            <Textarea
              id="healthStatus"
              value={form.healthStatus}
              onChange={(e) => setForm((f) => ({ ...f, healthStatus: e.target.value }))}
              rows={3}
              placeholder="Optional — health notes"
            />
            <Label htmlFor="anotherSourceInc">Another source of income</Label>
            <Textarea
              id="anotherSourceInc"
              value={form.anotherSourceInc}
              onChange={(e) => setForm((f) => ({ ...f, anotherSourceInc: e.target.value }))}
              rows={3}
            />
            <Label htmlFor="houseDescrip">House description</Label>
            <Textarea
              id="houseDescrip"
              value={form.houseDescrip}
              onChange={(e) => setForm((f) => ({ ...f, houseDescrip: e.target.value }))}
              rows={3}
            />
            <Label htmlFor="otherPersonHou">Other person in house</Label>
            <Textarea
              id="otherPersonHou"
              value={form.otherPersonHou}
              onChange={(e) => setForm((f) => ({ ...f, otherPersonHou: e.target.value }))}
              rows={3}
            />
            <Label htmlFor="serReport">Social / service report</Label>
            <Textarea
              id="serReport"
              value={form.serReport}
              onChange={(e) => setForm((f) => ({ ...f, serReport: e.target.value }))}
              rows={4}
            />
            <SheetFooter className="pt-2">
              <Button type="submit" disabled={saving || !canWrite}>
                {saving && <Loader2Icon className="size-4 animate-spin" />}
                {sheetMode === "create" ? "Create application" : "Save changes"}
              </Button>
            </SheetFooter>
          </form>
          )}
        </SheetContent>
      </Sheet>

      {childApplicant ? (
        <ChildControlContainer
          open={childOpen}
          onOpenChange={setChildOpen}
          applicantId={childApplicant.id}
          applicantName={childApplicant.name}
        />
      ) : null}
    </>
  );
}
