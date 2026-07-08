"use client";

import type { ReactNode } from "react";

export function CatalogTextInputField({
    label, value, onChange, placeholder, required = true, maxLength,
}: {
    label: ReactNode; value: string; onChange: (value: string) => void; placeholder: string; required?: boolean; maxLength?: number;
}) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</label>
            <input required={required} type="text" maxLength={maxLength}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder={placeholder} value={value} onChange={(event) => onChange(event.target.value)}
            />
        </div>
    );
}
