"use client";

import { Filter } from "lucide-react";
import type { SelectOption } from "./types";

export function CatalogSelectFilter({
    value,
    onChange,
    options,
    withFilterIcon = false,
    className = "",
}: {
    value: string;
    onChange: (value: string) => void;
    options: SelectOption[];
    withFilterIcon?: boolean;
    className?: string;
}) {
    return (
        <div className={`flex items-center gap-2 ${className}`.trim()}>
            {withFilterIcon ? <Filter className="text-slate-400" size={16} /> : null}
            <select
                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none"
                value={value}
                onChange={(event) => onChange(event.target.value)}
            >
                {options.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                ))}
            </select>
        </div>
    );
}
