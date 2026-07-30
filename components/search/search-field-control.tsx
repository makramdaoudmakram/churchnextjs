"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchFieldLookup } from "@/lib/search/search-api";
import type { ApplicationFieldMetadata } from "@/lib/search/types";

type Props = {
  applicationId: number;
  field: ApplicationFieldMetadata;
  value?: string;
  values?: string[];
  onChange: (next: { value?: string; values?: string[] }) => void;
};

export function SearchFieldControl({ applicationId, field, value, values, onChange }: Props) {
  const [lookupOptions, setLookupOptions] = React.useState<{ value: string; label: string }[]>([]);
  const [lookupLoading, setLookupLoading] = React.useState(false);

  const loadLookup = React.useCallback(async () => {
    if (!field.lookupTable) return;
    setLookupLoading(true);
    const res = await fetchFieldLookup(applicationId, field.id);
    if (res.success && res.data) {
      setLookupOptions(
        res.data.map((o) => ({
          value: String(o.value),
          label: o.label,
        }))
      );
    }
    setLookupLoading(false);
  }, [applicationId, field.id, field.lookupTable]);

  React.useEffect(() => {
    if (field.controlType === "Combobox" || field.dataType === "Lookup" || field.dataType === "MultiLookup") {
      void loadLookup();
    }
  }, [field.controlType, field.dataType, loadLookup]);

  const control = field.controlType;
  const w = Math.min(Math.max(field.width, 6), 12);

  if (control === "Checkbox" || field.dataType === "Boolean") {
    return (
      <div className="flex items-center gap-2 pt-6" style={{ gridColumn: `span ${w}` }}>
        <Checkbox
          id={`sf-${field.id}`}
          checked={value === "true"}
          onCheckedChange={(c) => onChange({ value: c === true ? "true" : "" })}
        />
        <Label htmlFor={`sf-${field.id}`}>{field.displayName}</Label>
      </div>
    );
  }

  if (control === "MultiSelect" || field.dataType === "MultiLookup") {
    const selected = new Set(values ?? []);
    return (
      <div className="space-y-2" style={{ gridColumn: `span ${w}` }}>
        <Label>{field.displayName}</Label>
        <div className="max-h-32 space-y-1 overflow-y-auto rounded-md border p-2">
          {lookupLoading && <p className="text-xs text-muted-foreground">Loading…</p>}
          {lookupOptions.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={selected.has(opt.value)}
                onCheckedChange={(checked) => {
                  const next = new Set(selected);
                  if (checked) next.add(opt.value);
                  else next.delete(opt.value);
                  onChange({ values: [...next] });
                }}
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>
    );
  }

  if (control === "Select" || field.dataType === "Enum") {
    const opts = field.enumOptions ?? [];
    return (
      <div className="space-y-2" style={{ gridColumn: `span ${w}` }}>
        <Label>{field.displayName}</Label>
        <Select value={value ?? ""} onValueChange={(v) => onChange({ value: v === "__clear" ? "" : v })}>
          <SelectTrigger>
            <SelectValue placeholder="—" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__clear">—</SelectItem>
            {opts.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  if (control === "Combobox" || field.dataType === "Lookup") {
    return (
      <div className="space-y-2" style={{ gridColumn: `span ${w}` }}>
        <Label>{field.displayName}</Label>
        <Select value={value ?? ""} onValueChange={(v) => onChange({ value: v === "__clear" ? "" : v })}>
          <SelectTrigger>
            <SelectValue placeholder={lookupLoading ? "Loading…" : "—"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__clear">—</SelectItem>
            {lookupOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  const inputType =
    control === "Number" || field.dataType === "Integer" ?
      "number"
    : control === "Decimal" || field.dataType === "Decimal" ?
      "number"
    : control === "Date" || field.dataType === "Date" ?
      "date"
    : "text";

  return (
    <div className="space-y-2" style={{ gridColumn: `span ${w}` }}>
      <Label>{field.displayName}</Label>
      <Input
        type={inputType}
        step={inputType === "number" ? "any" : undefined}
        value={value ?? ""}
        onChange={(e) => onChange({ value: e.target.value })}
      />
    </div>
  );
}
