"use client";

import type { SelectOption } from "./types";

export function CatalogSelectField({
    label, value, onChange, options, required = false, placeholder = "Select an option",
}: {
    label: string; value: string; onChange: (value: string) => void; options: SelectOption[]; required?: boolean; placeholder?: string;
}) {
    return (
        <div className="space-y-1.5">
            <label className="text-tiny font-bold text-foreground-tertiary uppercase tracking-wider">{label}</label>
            <select required={required} className="w-full px-4 py-2 bg-background border border-input rounded-lg text-body text-foreground font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                value={value} onChange={(e) => onChange(e.target.value)}>
                {placeholder && <option value="">{placeholder}</option>}
                {options.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
        </div>
    );
}
