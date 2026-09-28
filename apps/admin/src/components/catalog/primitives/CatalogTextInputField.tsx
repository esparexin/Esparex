"use client";

import type { ReactNode } from "react";
import { Input } from "@esparex/ui";

export function CatalogTextInputField({
    label, value, onChange, placeholder, required = true, maxLength,
}: {
    label: ReactNode; value: string; onChange: (value: string) => void; placeholder: string; required?: boolean; maxLength?: number;
}) {
    return (
        <div className="space-y-1.5">
            <label className="text-tiny font-bold text-foreground-tertiary uppercase tracking-wider">{label}</label>
            <Input required={required} type="text" maxLength={maxLength}
                className="px-4 font-medium"
                placeholder={placeholder} value={value} onChange={(event) => onChange(event.target.value)}
            />
        </div>
    );
}
