"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Search } from "@esparex/ui";
import type { SelectOption } from "./types";

export function CatalogAsyncComboboxFilter({
    value,
    onChange,
    options,
    placeholder,
    allLabel,
    disabled = false,
    loading = false,
    onSearchChange,
    className = "",
}: {
    value: string;
    onChange: (value: string) => void;
    options: SelectOption[];
    placeholder: string;
    allLabel: string;
    disabled?: boolean;
    loading?: boolean;
    onSearchChange?: (value: string) => void;
    className?: string;
}) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const rootRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const timer = window.setTimeout(() => onSearchChange?.(search), 250);
        return () => window.clearTimeout(timer);
    }, [onSearchChange, search]);

    useEffect(() => {
        const handlePointerDown = (event: PointerEvent) => {
            if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
        };
        window.addEventListener("pointerdown", handlePointerDown);
        return () => window.removeEventListener("pointerdown", handlePointerDown);
    }, []);

    const selectedLabel = useMemo(() => {
        if (!value || value === "all") return allLabel;
        return options.find((option) => option.value === value)?.label ?? placeholder;
    }, [allLabel, options, placeholder, value]);

    const visibleOptions = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase();
        const filtered = normalizedSearch ? options.filter((option) => option.label.toLowerCase().includes(normalizedSearch)) : options;
        return filtered.slice(0, 60);
    }, [options, search]);

    return (
        <div ref={rootRef} className={`relative ${className}`.trim()}>
            <button type="button" disabled={disabled}
                onClick={() => setOpen((current) => !current)}
                className="flex w-full items-center justify-between gap-2 rounded-lg border border-input bg-background px-3 py-2 text-left text-body text-foreground-secondary transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
            >
                <span className="truncate">{selectedLabel}</span>
                {loading ? <Loader2 size={14} className="shrink-0 animate-spin text-foreground-subtle" /> : <Search size={14} className="shrink-0 text-foreground-subtle" />}
            </button>
            {open ? (
                <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-lg border border-border bg-card shadow-lg">
                    <div className="border-b border-border/60 p-2">
                        <input type="text" value={search} onChange={(event) => setSearch(event.target.value)}
                            placeholder={placeholder} className="w-full rounded-md border border-input bg-background px-3 py-2 text-body text-foreground placeholder:text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary/40" autoFocus
                        />
                    </div>
                    <div className="max-h-64 overflow-y-auto py-1" role="listbox">
                        <button type="button" className="block w-full px-3 py-2 text-left text-body text-foreground-secondary hover:bg-muted/50 cursor-pointer"
                            onClick={() => { onChange("all"); setOpen(false); }}>{allLabel}</button>
                        {visibleOptions.map((option) => (
                            <button key={option.value} type="button" className="block w-full px-3 py-2 text-left text-body text-foreground-secondary hover:bg-muted/50 cursor-pointer"
                                onClick={() => { onChange(option.value); setOpen(false); }} role="option" aria-selected={option.value === value}>
                                <span className="block truncate">{option.label}</span>
                            </button>
                        ))}
                        {options.length > visibleOptions.length ? (
                            <div className="border-t border-border/60 px-3 py-2 text-caption text-foreground-tertiary">Showing {visibleOptions.length} of {options.length}. Search to narrow results.</div>
                        ) : null}
                        {!loading && visibleOptions.length === 0 ? <div className="px-3 py-3 text-body text-foreground-tertiary">No matches</div> : null}
                    </div>
                </div>
            ) : null}
        </div>
    );
}
