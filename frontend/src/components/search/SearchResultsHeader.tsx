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
};

const SORT_LABELS: Record<SortOption, string> = {
    relevance: "Relevance",
    newest: "Newest",
    price_low_high: "Price: Low → High",
    price_high_low: "Price: High → Low",
};

export function SearchResultsHeader({
    total,
    sort,
    view,
    onSortChange,
    onViewChange,
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
        <div className="sticky top-[100px] md:top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-100">
            <div className="flex items-center justify-between gap-4 px-4 py-2.5 md:px-0 md:py-3">
                {/* LEFT: Result count */}
                <div className="flex items-center gap-2">
                    <span className="hidden sm:block size-2 rounded-full bg-green-500 animate-pulse" />
                    <p className="text-sm text-slate-500 font-medium">
                        Showing <span className="text-slate-900">{total}</span> listing{total === 1 ? "" : "s"}
                    </p>
                </div>

                {/* RIGHT: Controls */}
                <div className="flex items-center gap-2">
                    {/* Sort */}
                    <div className="relative" ref={dropdownRef}>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setOpen((v) => !v)}
                            aria-haspopup="listbox"
                            aria-expanded={open}
                            aria-label="Sort listings"
                            className="gap-2 h-11 border-slate-200 hover:bg-slate-50 rounded-lg px-3"
                        >
                            <SortAsc className="size-4 text-slate-400" />
                            <span className="font-semibold text-slate-700 text-sm">{SORT_LABELS[sort]}</span>
                            <ChevronDown className={cn("size-4 text-slate-400 transition-transform", open && "rotate-180")} />
                        </Button>

                        {open && (
                            <ul
                                role="listbox"
                                className="
                                    absolute right-0 mt-2 w-52
                                    rounded-xl border border-slate-100 bg-white shadow-xl
                                    overflow-hidden z-50 p-1
                                    animate-in fade-in-0 zoom-in-95
                                "
                            >
                                {(Object.keys(SORT_LABELS) as SortOption[]).map((key) => (
                                    <li key={key}>
                                        <button
                                            role="option"
                                            aria-selected={sort === key}
                                            onClick={() => {
                                                onSortChange(key);
                                                setOpen(false);
                                            }}
                                            className={cn(
                                                "w-full px-3 py-2 text-left text-sm rounded-lg transition-colors",
                                                sort === key
                                                    ? "bg-slate-900 text-white font-medium"
                                                    : "text-slate-600 hover:bg-slate-50"
                                            )}
                                        >
                                            {SORT_LABELS[key]}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="h-4 w-px bg-slate-100 mx-1 hidden sm:block" />

                    {/* View toggle */}
                    <div className="hidden sm:flex items-center rounded-lg border border-slate-200 bg-slate-50/50 p-1">
                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => onViewChange("grid")}
                            aria-label="Grid view"
                            className={cn(
                                "h-7 w-7 rounded-md",
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
                                "h-7 w-7 rounded-md",
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
