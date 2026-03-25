"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronDown, LayoutGrid, List, SortAsc } from "lucide-react";

export type SortOption =
    | "relevance"
    | "newest"
    | "price_low_high"
    | "price_high_low";

type SearchResultsHeaderProps = {
    total: number;
    sort: SortOption;
    view: "grid" | "list";
    onSortChange: (v: SortOption) => void;
    onViewChange: (v: "grid" | "list") => void;
    filterNode?: React.ReactNode;
};

const SORT_LABELS: Record<SortOption, string> = {
    relevance: "Relevance",
    newest: "Newest",
    price_low_high: "Price: Low → High",
    price_high_low: "Price: High → Low",
};

const SORT_OPTIONS = Object.keys(SORT_LABELS) as SortOption[];

type SortDropdownTriggerProps = {
    open: boolean;
    sort: SortOption;
    onToggle: () => void;
    mobile?: boolean;
};

function SortDropdownTrigger({
    open,
    sort,
    onToggle,
    mobile = false,
}: SortDropdownTriggerProps) {
    if (mobile) {
        return (
            <Button
                variant="outline"
                onClick={onToggle}
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-label="Sort listings"
                className="gap-2 h-9 rounded-full border-slate-900 px-4 font-medium text-slate-900 text-sm shadow-none bg-white hover:bg-slate-50"
            >
                <span>Sort By</span>
                <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
            </Button>
        );
    }

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={onToggle}
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-label="Sort listings"
            className="gap-2 h-10 border-slate-200 hover:bg-slate-50 rounded-lg px-3 bg-white shadow-sm"
        >
            <SortAsc className="size-4 text-slate-400" />
            <span className="font-semibold text-slate-700 text-sm">{SORT_LABELS[sort]}</span>
            <ChevronDown className={cn("size-4 text-slate-400 transition-transform", open && "rotate-180")} />
        </Button>
    );
}

type SortDropdownMenuProps = {
    open: boolean;
    sort: SortOption;
    onSelect: (value: SortOption) => void;
    mobile?: boolean;
};

function SortDropdownMenu({
    open,
    sort,
    onSelect,
    mobile = false,
}: SortDropdownMenuProps) {
    if (!open) {
        return null;
    }

    return (
        <ul
            role="listbox"
            className={cn(
                "absolute mt-2 rounded-xl border border-slate-100 bg-white shadow-xl overflow-hidden z-50 p-1 animate-in fade-in-0 zoom-in-95",
                mobile ? "left-0 w-48" : "right-0 w-52"
            )}
        >
            {SORT_OPTIONS.map((key) => (
                <li key={key}>
                    <button
                        aria-selected={sort === key}
                        onClick={() => onSelect(key)}
                        className={cn(
                            "w-full px-3 py-2 text-left text-sm rounded-lg transition-colors",
                            sort === key ? "bg-slate-900 text-white font-medium" : "text-slate-600 hover:bg-slate-50"
                        )}
                    >
                        {SORT_LABELS[key]}
                    </button>
                </li>
            ))}
        </ul>
    );
}

export function SearchResultsHeader({
    total,
    sort,
    view,
    onSortChange,
    onViewChange,
    filterNode,
}: SearchResultsHeaderProps) {
    const [open, setOpen] = React.useState(false);
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    // Close dropdown on outside click
    React.useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <div className="sticky top-[100px] md:top-0 z-20 bg-white/95 backdrop-blur-md mb-4 md:mb-0 md:border-b md:border-slate-100">
            {/* ── MOBILE LAYOUT ────────────────────────────────────────── */}
            <div className="md:hidden">
                {/* 1. Filter & Sort Row */}
                <div className="flex items-center gap-4 px-4 py-3 border-b border-slate-100">
                    <div className="flex-shrink-0">
                        {filterNode}
                    </div>
                    <div className="flex-shrink-0">
                        <div className="relative" ref={dropdownRef}>
                            <SortDropdownTrigger
                                mobile
                                open={open}
                                sort={sort}
                                onToggle={() => setOpen((v) => !v)}
                            />
                            <SortDropdownMenu
                                mobile
                                open={open}
                                sort={sort}
                                onSelect={(value) => {
                                    onSortChange(value);
                                    setOpen(false);
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* 2. Count Row */}
                <div className="px-4 py-4">
                    <p className="text-sm text-slate-900">
                        {total} listing{total === 1 ? "" : "s"} found
                    </p>
                </div>
            </div>

            {/* ── DESKTOP LAYOUT ───────────────────────────────────────── */}
            <div className="hidden md:flex items-center justify-between gap-4 px-0 py-3 cursor-default">
                {/* LEFT: Result count */}
                <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-green-500 animate-pulse" />
                    <p className="text-sm text-slate-500 font-medium whitespace-nowrap">
                        Showing <span className="text-slate-900">{total}</span> listing{total === 1 ? "" : "s"}
                    </p>
                </div>

                {/* RIGHT: Controls */}
                <div className="flex items-center gap-2">
                    {/* Sort Dropdown */}
                    <div className="relative" ref={dropdownRef}>
                        <SortDropdownTrigger
                            open={open}
                            sort={sort}
                            onToggle={() => setOpen((v) => !v)}
                        />
                        <SortDropdownMenu
                            open={open}
                            sort={sort}
                            onSelect={(value) => {
                                onSortChange(value);
                                setOpen(false);
                            }}
                        />
                    </div>

                    <div className="h-4 w-px bg-slate-100 mx-1" />

                    {/* View toggle */}
                    <div className="flex items-center rounded-[10px] border border-slate-200 bg-slate-50/50 p-1">
                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => onViewChange("grid")}
                            aria-label="Grid view"
                            className={cn(
                                "h-8 w-8 rounded-md",
                                view === "grid" ? "bg-white shadow-sm text-slate-900" : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            <LayoutGrid className="size-4" />
                        </Button>
                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => onViewChange("list")}
                            aria-label="List view"
                            className={cn(
                                "h-8 w-8 rounded-md",
                                view === "list" ? "bg-white shadow-sm text-slate-900" : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            <List className="size-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
