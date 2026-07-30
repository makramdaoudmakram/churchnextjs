"use client";



import * as React from "react";

import { Loader2Icon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";

import { toast } from "sonner";



import { apiErrorMessage, normalizeRowVersion } from "@/lib/api-form-utils";

import {

  createFamilyMember,

  deleteFamilyMember,

  getFamilyMember,

  listFamilyMembers,

  updateFamilyMember,

  type FamilyMemberListItem,

} from "@/lib/family-members-api";

import { listLookupResourceForSelect } from "@/lib/lookup-resource-api";

import { listLookupsForSelect } from "@/lib/lookups-api";

import { listFathers } from "@/lib/fathers-api";

import { useCharityWrite } from "@/hooks/use-charity-write";

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



type Props = {

  open: boolean;

  onOpenChange: (open: boolean) => void;

  applicantId: number;

  applicantName: string;

};



const emptyChildForm = {

  fullName: "",

  relationshipId: "",

  educationLevelId: "",

  fatherOfConfessionId: "",

  school: "",

  age: "",

  salary: "",

  mobile: "",

  rowVersion: "",

};



export function ChildControlContainer({ open, onOpenChange, applicantId, applicantName }: Props) {

  const { canWrite } = useCharityWrite("applicants");

  const [rows, setRows] = React.useState<FamilyMemberListItem[]>([]);

  const [loading, setLoading] = React.useState(false);

  const [relationships, setRelationships] = React.useState<{ id: number; name: string }[]>([]);

  const [educationLevels, setEducationLevels] = React.useState<{ id: number; name: string }[]>([]);

  const [fathers, setFathers] = React.useState<{ id: number; name: string }[]>([]);

  const [editingId, setEditingId] = React.useState<number | null>(null);

  const [form, setForm] = React.useState(emptyChildForm);

  const [saving, setSaving] = React.useState(false);



  const loadChildren = React.useCallback(async () => {

    if (!applicantId) return;

    setLoading(true);

    const result = await listFamilyMembers({ pageNumber: 1, pageSize: 100, applicantId });

    setLoading(false);

    if (!result.success || !result.data) {

      setRows([]);

      return;

    }

    setRows(result.data.items ?? []);

  }, [applicantId]);



  const loadFormOptions = React.useCallback(async () => {

    const [rel, edu, f] = await Promise.all([

      listLookupsForSelect("RelationshipType", 200),

      listLookupResourceForSelect("education-levels"),

      listFathers({ pageNumber: 1, pageSize: 200 }),

    ]);

    if (rel.success && rel.data?.items) {

      setRelationships(rel.data.items.map((x) => ({ id: x.id, name: x.name })));

    } else setRelationships([]);

    if (edu.success && edu.data?.items) {

      setEducationLevels(edu.data.items.map((x) => ({ id: x.id, name: x.name })));

    } else setEducationLevels([]);

    if (f.success && f.data?.items) {

      setFathers(f.data.items.map((x) => ({ id: x.fatherOfConfessionId, name: x.fatherName })));

    } else setFathers([]);

  }, []);



  React.useEffect(() => {

    if (!open) return;

    void loadChildren();

    void loadFormOptions();

    setEditingId(null);

    setForm(emptyChildForm);

  }, [open, loadChildren, loadFormOptions, applicantId]);



  const startEdit = async (row: FamilyMemberListItem) => {

    setEditingId(row.familyMemberId);

    setSaving(true);

    const result = await getFamilyMember(row.familyMemberId);

    setSaving(false);

    if (!result.success || !result.data) {

      toast.error(apiErrorMessage(result, "Could not load child"));

      return;

    }

    const d = result.data;

    setForm({

      fullName: d.fullName,

      relationshipId: String(d.relationshipId),

      educationLevelId: String(d.educationLevelId),

      fatherOfConfessionId: String(d.fatherOfConfessionId),

      school: d.school ?? "",

      age: d.age != null ? String(d.age) : "",

      salary: d.salary != null ? String(d.salary) : "",

      mobile: d.mobile ?? "",

      rowVersion: normalizeRowVersion(d.rowVersion),

    });

  };



  const onDeleteChild = async (row: FamilyMemberListItem) => {

    if (!confirm(`Delete "${row.fullName}"?`)) return;

    const result = await deleteFamilyMember(row.familyMemberId);

    if (!result.success) {

      toast.error(apiErrorMessage(result, "Delete failed"));

      return;

    }

    toast.success(result.message ?? "Deleted");

    void loadChildren();

  };



  const onSaveChild = async (e: React.FormEvent) => {

    e.preventDefault();

    if (

      !form.fullName.trim() ||

      !form.relationshipId ||

      !form.educationLevelId ||

      !form.fatherOfConfessionId

    ) {

      toast.error("Name, relationship, education, and father of confession are required");

      return;

    }

    setSaving(true);

    const payload = {

      applicantId,

      fullName: form.fullName.trim(),

      relationshipId: Number(form.relationshipId),

      educationLevelId: Number(form.educationLevelId),

      fatherOfConfessionId: Number(form.fatherOfConfessionId),

      school: form.school.trim() || null,

      age: form.age ? Number(form.age) : null,

      salary: form.salary ? Number(form.salary) : null,

      mobile: form.mobile.trim() || null,

    };



    if (editingId === null) {

      const result = await createFamilyMember(payload);

      setSaving(false);

      if (!result.success) {

        toast.error(apiErrorMessage(result, "Create failed"));

        return;

      }

      toast.success(result.message ?? "Child added");

    } else {

      if (!form.rowVersion) {

        setSaving(false);

        toast.error("Missing row version — select edit again.");

        return;

      }

      const result = await updateFamilyMember(editingId, {

        ...payload,

        rowVersion: form.rowVersion,

      });

      setSaving(false);

      if (!result.success) {

        toast.error(apiErrorMessage(result, "Update failed"));

        return;

      }

      toast.success(result.message ?? "Child updated");

    }

    setEditingId(null);

    setForm(emptyChildForm);

    void loadChildren();

  };



  return (

    <Sheet open={open} onOpenChange={onOpenChange}>

      <SheetContent className="flex h-full w-[85vw] max-w-[85vw] flex-col overflow-y-auto sm:max-w-[85vw]">

        <SheetHeader>

          <SheetTitle>Child control</SheetTitle>

          <SheetDescription>

            Family members for: <strong>{applicantName}</strong>

          </SheetDescription>

        </SheetHeader>



        <div className="rounded-lg border">

          <Table>

            <TableHeader>

              <TableRow>

                <TableHead>Name</TableHead>

                <TableHead>Relationship</TableHead>

                <TableHead>Education</TableHead>

                <TableHead>Father</TableHead>

                <TableHead>Age</TableHead>

                <TableHead className="text-right">Actions</TableHead>

              </TableRow>

            </TableHeader>

            <TableBody>

              {loading ? (

                <TableRow>

                  <TableCell colSpan={6} className="h-16 text-center">

                    <Loader2Icon className="mx-auto size-5 animate-spin" />

                  </TableCell>

                </TableRow>

              ) : rows.length ? (

                rows.map((row) => (

                  <TableRow key={row.familyMemberId}>

                    <TableCell>{row.fullName}</TableCell>

                    <TableCell>{row.relationshipName}</TableCell>

                    <TableCell>{row.educationLevelName}</TableCell>

                    <TableCell>{row.fatherOfConfessionName}</TableCell>

                    <TableCell>{row.age ?? "—"}</TableCell>

                    <TableCell className="text-right">

                      <Button variant="ghost" size="icon-sm" disabled={!canWrite} onClick={() => void startEdit(row)}>

                        <PencilIcon className="size-4" />

                      </Button>

                      <Button variant="ghost" size="icon-sm" className="text-destructive" disabled={!canWrite} onClick={() => void onDeleteChild(row)}>

                        <Trash2Icon className="size-4" />

                      </Button>

                    </TableCell>

                  </TableRow>

                ))

              ) : (

                <TableRow>

                  <TableCell colSpan={6} className="text-center text-muted-foreground">

                    No children yet.

                  </TableCell>

                </TableRow>

              )}

            </TableBody>

          </Table>

        </div>



        <form onSubmit={onSaveChild} className="flex flex-col gap-3 px-1">

          <p className="text-sm font-medium">{editingId === null ? "Add child" : "Edit child"}</p>

          <div className="grid gap-2">

            <Label htmlFor="childName">Full name</Label>

            <Input id="childName" value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} required />

          </div>

          <div className="grid gap-2">

            <Label>Relationship</Label>

            <Select value={form.relationshipId} onValueChange={(v) => setForm((f) => ({ ...f, relationshipId: v }))}>

              <SelectTrigger>

                <SelectValue placeholder="Select relationship" />

              </SelectTrigger>

              <SelectContent>

                {relationships.map((r) => (

                  <SelectItem key={r.id} value={String(r.id)}>

                    {r.name}

                  </SelectItem>

                ))}

              </SelectContent>

            </Select>

          </div>

          <div className="grid gap-2">

            <Label>Education level</Label>

            <Select value={form.educationLevelId} onValueChange={(v) => setForm((f) => ({ ...f, educationLevelId: v }))}>

              <SelectTrigger>

                <SelectValue placeholder="Select education" />

              </SelectTrigger>

              <SelectContent>

                {educationLevels.map((x) => (

                  <SelectItem key={x.id} value={String(x.id)}>

                    {x.name}

                  </SelectItem>

                ))}

              </SelectContent>

            </Select>

          </div>

          <div className="grid gap-2">

            <Label>Father of confession</Label>

            <Select value={form.fatherOfConfessionId} onValueChange={(v) => setForm((f) => ({ ...f, fatherOfConfessionId: v }))}>

              <SelectTrigger>

                <SelectValue placeholder="Select father" />

              </SelectTrigger>

              <SelectContent>

                {fathers.map((x) => (

                  <SelectItem key={x.id} value={String(x.id)}>

                    {x.name}

                  </SelectItem>

                ))}

              </SelectContent>

            </Select>

          </div>

          <div className="grid gap-2">

            <Label htmlFor="childSchool">School (optional)</Label>

            <Input id="childSchool" value={form.school} onChange={(e) => setForm((f) => ({ ...f, school: e.target.value }))} />

          </div>

          <div className="grid grid-cols-2 gap-3">

            <div className="grid gap-2">

              <Label htmlFor="childAge">Age (optional)</Label>

              <Input id="childAge" type="number" min={0} value={form.age} onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))} />

            </div>

            <div className="grid gap-2">

              <Label htmlFor="childMobile">Mobile (optional)</Label>

              <Input id="childMobile" value={form.mobile} onChange={(e) => setForm((f) => ({ ...f, mobile: e.target.value }))} />

            </div>

          </div>

          <SheetFooter className="px-0">

            {editingId !== null ? (

              <Button type="button" variant="outline" onClick={() => { setEditingId(null); setForm(emptyChildForm); }}>

                Cancel edit

              </Button>

            ) : null}

            <Button type="submit" disabled={saving || !canWrite}>

              {saving && <Loader2Icon className="size-4 animate-spin" />}

              <PlusIcon className="size-4" />

              {editingId === null ? "Add child" : "Save child"}

            </Button>

          </SheetFooter>

        </form>

      </SheetContent>

    </Sheet>

  );

}


