"use client";

import { Search, Filter } from "lucide-react";

/**
 * AdminFilterToolbar — canonical horizontal filter strip for all admin operational screens.
 *
 * SSOT for search + status filter row. Extend via the `extraFilters` slot for screen-specific needs.
 * DO NOT build ad-hoc filter cards in individual screens — use this component.
 */

export type StatusOption = {
    value: string;
    label: string;
};

interface AdminFilterToolbarProps {
    /** Current search value */
    search: string;
    /** Called when search input changes */
    onSearchChange: (value: string) => void;
    /** Placeholder text for the search input */
    searchPlaceholder?: string;

    /** Current status filter value. Omit to hide the status select. */
    status?: string;
    /** Called when status select changes. Must be provided when `status` is provided. */
    onStatusChange?: (value: string) => void;
    /** Options for the status dropdown. First option should be "All". */
    statusOptions?: StatusOption[];

    /** Slot for additional filter controls (selects, date pickers, etc.) */
    extraFilters?: React.ReactNode;

    className?: string;
}

export function AdminFilterToolbar({
    search,
    onSearchChange,
    searchPlaceholder = "Search...",
    status,
    onStatusChange,
    statusOptions,
    extraFilters,
    className = "",
}: AdminFilterToolbarProps) {
    return (
        <div
            className={`flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm ${className}`}
        >
            {/* Search */}
            <div className="relative flex min-w-[180px] flex-1">
                <Search
                    className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                    size={15}
                    aria-hidden="true"
                />
                <input
                    type="search"
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder={searchPlaceholder}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200"
                />
            </div>

            {/* Status filter */}
            {status !== undefined && statusOptions && onStatusChange && (
                <div className="flex items-center gap-1.5">
                    <Filter className="shrink-0 text-slate-400" size={14} aria-hidden="true" />
                    <select
                        value={status}
                        onChange={(e) => onStatusChange(e.target.value)}
                        className="rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-2.5 pr-7 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-200"
                    >
                        {statusOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* Extra slot */}
            {extraFilters}
        </div>
    );
}
