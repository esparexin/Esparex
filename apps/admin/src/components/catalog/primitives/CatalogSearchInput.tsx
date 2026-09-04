"use client";

import { Search } from "@esparex/ui";

export function CatalogSearchInput({
    value,
    onChange,
    placeholder,
    className = "",
}: {
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    className?: string;
}) {
    return (
        <div className={`relative ${className}`.trim()}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-subtle" size={18} />
            <input
                type="text"
                placeholder={placeholder}
                className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg text-body text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 transition-all"
                value={value}
                onChange={(event) => onChange(event.target.value)}
            />
        </div>
    );
}
