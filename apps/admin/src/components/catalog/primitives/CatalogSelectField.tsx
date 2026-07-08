"use client";

import type { SelectOption } from "./types";

export function CatalogSelectField({
    label, value, onChange, options, required = false, placeholder = "Select an option",
}: {
    label: string; value: string; onChange: (value: string) => void; options: SelectOption[]; required?: boolean; placeholder?: string;
}) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</label>
            <select required={required} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={value} onChange={(e) => onChange(e.target.value)}>
                {placeholder && <option value="">{placeholder}</option>}
                {options.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
        </div>
    );
}
