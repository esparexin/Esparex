"use client";

import { Input, Search } from "@esparex/ui";

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
            <Input
                type="text"
                placeholder={placeholder}
                className="pl-10"
                value={value}
                onChange={(event) => onChange(event.target.value)}
            />
        </div>
    );
}
