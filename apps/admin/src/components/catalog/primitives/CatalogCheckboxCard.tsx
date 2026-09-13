"use client";

import type { ReactNode } from "react";

export function CatalogCheckboxCard({
    checked, onChange, label,
}: {
    checked: boolean; onChange: (checked: boolean) => void; label: ReactNode;
}) {
    return (
        <label className="flex items-center gap-3 p-3 bg-muted/20 border border-border rounded-lg cursor-pointer hover:bg-card hover:border-primary/50 transition-all">
            <input type="checkbox" className="w-4 h-4 text-primary rounded border-input focus-visible:ring-2 focus-visible:ring-primary/40"
                checked={checked} onChange={(event) => onChange(event.target.checked)} />
            <span className="text-body font-semibold text-foreground-secondary">{label}</span>
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
