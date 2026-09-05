"use client";

import { Search, Filter } from "@esparex/ui";

/**
 * AdminFilterToolbar — canonical horizontal filter strip for all admin operational screens.
 *
 * SSOT for search + status filter row. Extend via the `extraFilters` slot for screen-specific needs.
 * DO NOT build ad-hoc filter cards in individual screens — use this component.
 */

type StatusOption = {
    value: string;
    label: string;
};

interface AdminFilterToolbarProps {
    /** Explicitly enable or disable the search input. Defaults to true if onSearchChange is provided. */
    showSearch?: boolean;
    /** Current search value */
    search?: string;
    /** Called when search input changes. Omit if search is not supported. */
    onSearchChange?: (value: string) => void;
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
    showSearch = true,
    search = "",
    onSearchChange,
    searchPlaceholder = "Search...",
    status,
    onStatusChange,
    statusOptions,
    extraFilters,
    className = "",
}: AdminFilterToolbarProps) {
    const isSearchVisible = showSearch && Boolean(onSearchChange);

    return (
        <div
            className={`flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 shadow-sm ${className}`}
        >
            {/* Search */}
            {isSearchVisible && onSearchChange && (
                <div className="relative flex min-w-[180px] flex-1">
                    <Search
                        className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-foreground-subtle"
                        size={15}
                        aria-hidden="true"
                    />
                    <input
                        type="search"
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder={searchPlaceholder}
                        aria-label={searchPlaceholder}
                        className="w-full rounded-lg border border-input bg-background py-1.5 pl-8 pr-3 text-body text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    />
                </div>
            )}

            {/* Status filter */}
            {status !== undefined && statusOptions && onStatusChange && (
                <div className="flex items-center gap-1.5">
                    <Filter className="shrink-0 text-foreground-subtle" size={14} aria-hidden="true" />
                    <select
                        value={status}
                        onChange={(e) => onStatusChange(e.target.value)}
                        aria-label="Filter by status"
                        className="rounded-lg border border-input bg-background py-1.5 pl-2.5 pr-7 text-body font-medium text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
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
