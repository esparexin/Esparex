"use client";

import { Search } from "lucide-react";

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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
                type="text"
                placeholder={placeholder}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                value={value}
                onChange={(event) => onChange(event.target.value)}
            />
        </div>
    );
}
