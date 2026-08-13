"use client";

import { Filter } from "@esparex/ui";
import type { SelectOption } from "./types";

export function CatalogSelectFilter({
    value,
    onChange,
    options,
    withFilterIcon = false,
    className = "",
    ariaLabel = "Filter selection",
}: {
    value: string;
    onChange: (value: string) => void;
    options: SelectOption[];
    withFilterIcon?: boolean;
    className?: string;
    ariaLabel?: string;
}) {
    return (
        <div className={`flex items-center gap-2 ${className}`.trim()}>
            {withFilterIcon ? <Filter className="text-foreground-subtle" size={16} /> : null}
            <select
                className="flex-1 bg-background border border-border rounded-lg py-2 px-3 text-sm text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 transition-all cursor-pointer"
                value={value}
                aria-label={ariaLabel}
                onChange={(event) => onChange(event.target.value)}
            >
                {options.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                ))}
            </select>
        </div>
    );
}
