"use client";

import type { ReactNode } from "react";

export function CatalogTextInputField({
    label, value, onChange, placeholder, required = true, maxLength,
}: {
    label: ReactNode; value: string; onChange: (value: string) => void; placeholder: string; required?: boolean; maxLength?: number;
}) {
    return (
        <div className="space-y-1.5">
            <label className="text-tiny font-bold text-foreground-tertiary uppercase tracking-wider">{label}</label>
            <input required={required} type="text" maxLength={maxLength}
                className="w-full px-4 py-2 bg-background border border-input rounded-lg text-body text-foreground placeholder:text-muted-foreground font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                placeholder={placeholder} value={value} onChange={(event) => onChange(event.target.value)}
            />
        </div>
    );
}
