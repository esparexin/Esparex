"use client";

import type { CategoryFilter } from "@esparex/contracts";
import { cn } from "@/components/ui/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field } from "@/components/ui/field";
import { Z_INDEX } from "@/lib/zIndexConfig";

type ExtendedCategoryFilter = CategoryFilter & { inputType?: string; defaultValue?: unknown; dependsOn?: string; visibleWhen?: unknown; showWhen?: unknown; };
const ATTRIBUTE_FIELD_TYPES = new Set(["text", "textarea", "number", "select", "checkbox", "radio", "multi-select", "multiselect"]);

const getFilterType = (filter: ExtendedCategoryFilter): string => {
    const rawType = filter.inputType || filter.type;
    if (rawType === "range") return "number";
    return String(rawType || "text").toLowerCase();
};

export function getVisibleAttributeFilters(schema: { filters: CategoryFilter[] } | null, attributes: unknown): ExtendedCategoryFilter[] {
    if (!schema?.filters) return [];
    return schema.filters.map((f) => f as ExtendedCategoryFilter).filter((f) => ATTRIBUTE_FIELD_TYPES.has(getFilterType(f))).filter((f) => {
        if (!f.dependsOn) return true;
        const dv = attributes && typeof attributes === "object" ? (attributes as Record<string, unknown>)[f.dependsOn] : undefined;
        const expected = f.visibleWhen ?? f.showWhen;
        if (expected === undefined) return Boolean(dv);
        return Array.isArray(expected) ? expected.includes(dv) : dv === expected;
    });
}

export function renderAttributeField(filter: ExtendedCategoryFilter, value: unknown, error: string | undefined, updateAttribute: (id: string, val: unknown) => void) {
    const fieldType = getFilterType(filter);
    if (fieldType === "textarea") {
        return <Field key={filter.id} label={filter.name} required={filter.isRequired} error={error}>
            <Textarea value={typeof value === "string" ? value : ""} onChange={(e) => updateAttribute(filter.id, e.target.value)} className="min-h-24 rounded-xl border-2 border-slate-100 focus:border-primary text-base" />
        </Field>;
    }
    if (fieldType === "number") {
        return <Field key={filter.id} label={filter.name} required={filter.isRequired} error={error}>
            <Input type="number" min={filter.min} max={filter.max} value={typeof value === "number" || typeof value === "string" ? value : ""} onChange={(e) => updateAttribute(filter.id, e.target.value === "" ? "" : Number(e.target.value))} className="h-11 rounded-xl border-2 border-slate-100 focus:border-primary text-base" />
        </Field>;
    }
    if (fieldType === "radio" && filter.options?.length) {
        return <Field key={filter.id} label={filter.name} required={filter.isRequired} error={error}>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={filter.name}>
                {filter.options.map((opt) => {
                    const checked = value === opt.value;
                    return <button key={opt.value} type="button" role="radio" aria-checked={checked} onClick={() => updateAttribute(filter.id, opt.value)}
                        className={cn("h-11 rounded-full border px-3 text-sm font-medium transition-all", checked ? "border-primary bg-primary text-primary-foreground" : "border-slate-200 bg-white text-foreground-tertiary hover:border-slate-300")}>{opt.label}</button>;
                })}
            </div>
        </Field>;
    }
    if (fieldType === "select" && filter.options?.length) {
        return <Field key={filter.id} label={filter.name} required={filter.isRequired} error={error}>
            <Select value={typeof value === "string" ? value : undefined} onValueChange={(nv) => updateAttribute(filter.id, nv)}>
                <SelectTrigger className="h-11 rounded-xl border-2 border-slate-200 bg-white font-normal text-base"><SelectValue placeholder={`Select ${filter.name.toLowerCase()}`} /></SelectTrigger>
                <SelectContent style={{ zIndex: Z_INDEX.selectContent }} className="rounded-xl border-2 border-slate-100 shadow-xl">
                    {filter.options.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                </SelectContent>
            </Select>
        </Field>;
    }
    if (fieldType === "checkbox" && !filter.options?.length) {
        return <Field key={filter.id} label={filter.name} required={filter.isRequired} error={error}>
            <label className="flex h-11 cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 text-base font-normal text-foreground-secondary">
                <Checkbox checked={value === true} onCheckedChange={(nc) => updateAttribute(filter.id, nc === true)} />{filter.name}
            </label>
        </Field>;
    }
    if ((fieldType === "checkbox" || fieldType === "multi-select" || fieldType === "multiselect") && filter.options?.length) {
        const selectedValues = Array.isArray(value) ? value.map(String) : [];
        return <Field key={filter.id} label={filter.name} required={filter.isRequired} error={error}>
            <div className="flex flex-wrap gap-2">
                {filter.options.map((opt) => {
                    const checked = selectedValues.includes(opt.value);
                    return <label key={opt.value} className={cn("flex h-11 cursor-pointer items-center gap-2 rounded-full border px-3 text-sm font-medium transition-all", checked ? "border-primary bg-primary text-primary-foreground" : "border-slate-200 bg-white text-foreground-tertiary hover:border-slate-300")}>
                        <Checkbox checked={checked} onCheckedChange={() => updateAttribute(filter.id, checked ? selectedValues.filter((i) => i !== opt.value) : [...selectedValues, opt.value])} className="h-3.5 w-3.5" />{opt.label}
                    </label>;
                })}
            </div>
        </Field>;
    }
    return <Field key={filter.id} label={filter.name} required={filter.isRequired} error={error}>
        <Input value={typeof value === "string" ? value : ""} onChange={(e) => updateAttribute(filter.id, e.target.value)} className="h-11 rounded-xl border-2 border-slate-100 focus:border-primary text-base" />
    </Field>;
}
