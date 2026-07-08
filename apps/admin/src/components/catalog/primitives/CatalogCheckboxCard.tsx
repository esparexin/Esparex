"use client";

import type { ReactNode } from "react";

export function CatalogCheckboxCard({
    checked, onChange, label,
}: {
    checked: boolean; onChange: (checked: boolean) => void; label: ReactNode;
}) {
    return (
        <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer hover:bg-white hover:border-primary/50 transition-all">
            <input type="checkbox" className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary/20"
                checked={checked} onChange={(event) => onChange(event.target.checked)} />
            <span className="text-sm font-semibold text-slate-700">{label}</span>
        </label>
    );
}

export function CatalogActiveCheckboxField({
    checked, onChange, label = "Active",
}: {
    checked: boolean; onChange: (checked: boolean) => void; label?: ReactNode;
}) {
    return <CatalogCheckboxCard checked={checked} onChange={onChange} label={label} />;
}
