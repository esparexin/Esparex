"use client";

import type { CategoryFilter } from "@esparex/contracts";
import { cn } from "@/lib/utils";
import { Input } from "@esparex/ui";
import { Textarea } from "@esparex/ui";
import { Checkbox } from "@esparex/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@esparex/ui";
import { Field } from "@esparex/ui";

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
        return <Field key={filter.id} label={filter.name} labelClassName="text-body font-semibold text-foreground-secondary" required={filter.isRequired} error={error}>
            <Textarea value={typeof value === "string" ? value : ""} onChange={(e) => updateAttribute(filter.id, e.target.value)} className="min-h-[100px] rounded-xl border border-border focus:border-primary text-body-lg md:text-body font-normal text-foreground placeholder:text-foreground-subtle resize-none p-3" />
        </Field>;
    }
    if (fieldType === "number") {
        return <Field key={filter.id} label={filter.name} labelClassName="text-body font-semibold text-foreground-secondary" required={filter.isRequired} error={error}>
            <Input type="number" min={filter.min} max={filter.max} value={typeof value === "number" || typeof value === "string" ? value : ""} onChange={(e) => updateAttribute(filter.id, e.target.value === "" ? "" : Number(e.target.value))} className="h-11 rounded-xl border border-border focus:border-primary text-body-lg md:text-body font-normal text-foreground placeholder:text-foreground-subtle" />
        </Field>;
    }
    if (fieldType === "radio" && filter.options?.length) {
        return <Field key={filter.id} label={filter.name} labelClassName="text-body font-semibold text-foreground-secondary" required={filter.isRequired} error={error}>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={filter.name}>
                {filter.options.map((opt) => {
                    const checked = value === opt.value;
                    return <button key={opt.value} type="button" role="radio" aria-checked={checked} onClick={() => updateAttribute(filter.id, opt.value)}
                        className={cn("h-8 sm:h-9 rounded-full border px-3 text-caption sm:text-small font-medium transition-all cursor-pointer", checked ? "border-primary bg-primary text-primary-foreground font-medium" : "border-border bg-card text-foreground-secondary hover:border-primary/40")}>{opt.label}</button>;
                })}
            </div>
        </Field>;
    }
    if (fieldType === "select" && filter.options?.length) {
        return <Field key={filter.id} label={filter.name} labelClassName="text-body font-semibold text-foreground-secondary" required={filter.isRequired} error={error}>
            <Select value={typeof value === "string" ? value : undefined} onValueChange={(nv) => updateAttribute(filter.id, nv)}>
                <SelectTrigger className="h-11 rounded-xl border border-border bg-card font-normal text-body-lg md:text-body"><SelectValue placeholder={`Select ${filter.name.toLowerCase()}`} /></SelectTrigger>
                <SelectContent className="rounded-xl border border-border shadow-xl bg-popover z-50">
                    {filter.options.map((opt) => <SelectItem key={opt.value} value={opt.value} className="text-body font-normal">{opt.label}</SelectItem>)}
                </SelectContent>
            </Select>
        </Field>;
    }
    if (fieldType === "checkbox" && !filter.options?.length) {
        return <Field key={filter.id} label={filter.name} labelClassName="text-body font-semibold text-foreground-secondary" required={filter.isRequired} error={error}>
            <label className="flex h-11 cursor-pointer items-center gap-3 rounded-xl border border-border bg-card px-3 text-caption sm:text-small font-normal text-foreground-secondary">
                <Checkbox checked={value === true} onCheckedChange={(nc) => updateAttribute(filter.id, nc === true)} />{filter.name}
            </label>
        </Field>;
    }
    if ((fieldType === "checkbox" || fieldType === "multi-select" || fieldType === "multiselect") && filter.options?.length) {
        const selectedValues = Array.isArray(value) ? value.map(String) : [];
        return <Field key={filter.id} label={filter.name} labelClassName="text-body font-semibold text-foreground-secondary" required={filter.isRequired} error={error}>
            <div className="flex flex-wrap gap-2">
                {filter.options.map((opt) => {
                    const checked = selectedValues.includes(opt.value);
                    return <label key={opt.value} className={cn("flex h-8 sm:h-9 cursor-pointer items-center gap-2 rounded-full border px-3 text-caption sm:text-small font-medium transition-all", checked ? "border-primary bg-primary text-primary-foreground font-medium" : "border-border bg-card text-foreground-secondary hover:border-primary/40")}>
                        <Checkbox checked={checked} onCheckedChange={() => updateAttribute(filter.id, checked ? selectedValues.filter((i) => i !== opt.value) : [...selectedValues, opt.value])} className="h-3.5 w-3.5" />{opt.label}
                    </label>;
                })}
            </div>
        </Field>;
    }
    return <Field key={filter.id} label={filter.name} labelClassName="text-body font-semibold text-foreground-secondary" required={filter.isRequired} error={error}>
        <Input value={typeof value === "string" ? value : ""} onChange={(e) => updateAttribute(filter.id, e.target.value)} className="h-11 rounded-xl border border-border focus:border-primary text-body-lg md:text-body font-normal text-foreground placeholder:text-foreground-subtle" />
    </Field>;
}
