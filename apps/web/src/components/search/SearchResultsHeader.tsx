"use client";

import * as React from "react";
import { Button, buttonVariants } from "@esparex/ui";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ChevronDown, LayoutGrid, List, SortAsc } from "lucide-react";
import {
    PUBLIC_BROWSE_SORT_LABELS,
    type SortOption,
} from "@/lib/publicBrowseSort";

export type { SortOption } from "@/lib/publicBrowseSort";

type SearchResultsHeaderProps = {
    total: number;
    sort: SortOption;
    view: "grid" | "list";
    onSortChange: (v: SortOption) => void;
    onViewChange: (v: "grid" | "list") => void;
    filterNode?: React.ReactNode;
    activeFilterCount?: number;
    categoryName?: string | null;
};

const SORT_LABELS = PUBLIC_BROWSE_SORT_LABELS;

const SORT_OPTIONS = Object.keys(SORT_LABELS) as SortOption[];

type SortDropdownTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    open: boolean;
    sort: SortOption;
};

const SortDropdownTrigger = React.forwardRef<HTMLButtonElement, SortDropdownTriggerProps>(function SortDropdownTrigger({
    className,
    open,
    sort,
    type = "button",
    ...props
}, ref) {
    return (
        <button
            ref={ref}
            type={type}
            aria-haspopup="menu"
            aria-expanded={open}
            aria-label={`Sort listings, current ${SORT_LABELS[sort]}`}
            className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "h-10 shrink-0 gap-2 rounded-lg border-slate-200 bg-white px-3 shadow-sm hover:bg-slate-50",
                className
            )}
            {...props}
        >
            <SortAsc className="size-4 text-foreground-subtle" />
            <span className="font-semibold text-slate-700 text-sm">Sorted: {SORT_LABELS[sort]}</span>
            <ChevronDown className={cn("size-4 text-foreground-subtle transition-transform", open && "rotate-180")} />
        </button>
    );
});

type SortDropdownMenuProps = {
    sort: SortOption;
    onSelect: (value: SortOption) => void;
};

function SortDropdownMenu({
    sort,
    onSelect,
}: SortDropdownMenuProps) {
    return (
        <DropdownMenuContent
            align="end"
            sideOffset={8}
            className="w-52 rounded-xl border border-slate-100 p-1 shadow-xl"
        >
            {SORT_OPTIONS.map((key) => (
                <DropdownMenuItem
                    key={key}
                    onSelect={() => onSelect(key)}
                    aria-selected={sort === key}
                    className={cn(
                        "min-h-[44px] cursor-pointer rounded-lg px-3 py-2.5 text-sm",
                        sort === key
                            ? "bg-slate-900 text-white font-medium focus:bg-slate-900 focus:text-white"
                            : "text-foreground-tertiary focus:bg-slate-50 focus:text-foreground-secondary"
                    )}
                >
                    {SORT_LABELS[key]}
                </DropdownMenuItem>
            ))}
        </DropdownMenuContent>
    );
}

type SortDropdownProps = {
    open: boolean;
    onOpenChange: (nextOpen: boolean) => void;
    sort: SortOption;
    onSelect: (value: SortOption) => void;
};

function SortDropdown({
    open,
    onOpenChange,
    sort,
    onSelect,
}: SortDropdownProps) {
    return (
        <DropdownMenu open={open} onOpenChange={onOpenChange}>
            <DropdownMenuTrigger asChild>
                <SortDropdownTrigger
                    open={open}
                    sort={sort}
                />
            </DropdownMenuTrigger>
            <SortDropdownMenu
                sort={sort}
                onSelect={(value) => {
                    onSelect(value);
                    onOpenChange(false);
                }}
            />
        </DropdownMenu>
    );
}

export function SearchResultsHeader({
    total,
    sort,
    view,
    onSortChange,
    onViewChange,
    filterNode,
    activeFilterCount = 0,
    categoryName,
}: SearchResultsHeaderProps) {
    const [sortOpen, setSortOpen] = React.useState(false);

    return (
        <div className="sticky top-[6.25rem] md:top-0 z-20 bg-white/95 backdrop-blur-md mb-4 md:mb-0 border-b border-slate-100 py-3 px-3 md:px-0">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                {/* Result count & indicator */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 flex-1 min-w-0">
                    <div className="flex items-center justify-between min-w-0 flex-1 md:flex-initial">
                        <div className="flex flex-col md:flex-row md:items-baseline md:gap-3 min-w-0">
                            {categoryName && (
                                <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight leading-none mb-1 md:mb-0">
                                    {categoryName}
                                </h2>
                            )}
                            <div className="flex items-center gap-2 min-w-0">
                                <span className={cn("size-2 rounded-full flex-shrink-0", total > 0 ? "bg-green-500 animate-pulse" : "bg-slate-300")} />
                                <p className="text-sm text-slate-700 font-semibold md:font-medium truncate">
                                    <span className="text-slate-950 font-bold">{total}</span> {total === 1 ? "listing" : "listings"} available
                                    {activeFilterCount > 0 ? ` • ${activeFilterCount} active` : ""}
                                </p>
                            </div>
                        </div>

                        {/* View Toggle (Mobile inline) */}
                        <div className="md:hidden flex items-center gap-2">
                            <Button
                                size="icon"
                                variant="outline"
                                onClick={() => onViewChange(view === "grid" ? "list" : "grid")}
                                aria-label={view === "grid" ? "Switch to list view" : "Switch to grid view"}
                                className="h-10 w-10 flex-shrink-0 rounded-full border-slate-200 bg-white shadow-none"
                            >
                                {view === "grid"
                                    ? <List className="size-4 text-foreground-tertiary" />
                                    : <LayoutGrid className="size-4 text-foreground-tertiary" />}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Controls: Filter trigger (mobile), Sort Dropdown, View Toggles (desktop) */}
                <div className="flex flex-wrap items-center justify-between md:justify-end gap-2">
                    <div className="flex items-center gap-2">
                        {filterNode && (
                            <div className="shrink-0 md:hidden">
                                {filterNode}
                            </div>
                        )}

                        <SortDropdown
                            open={sortOpen}
                            onOpenChange={setSortOpen}
                            sort={sort}
                            onSelect={onSortChange}
                        />
                    </div>

                    {/* View Toggle (Desktop) */}
                    <div className="hidden md:flex items-center rounded-[10px] border border-slate-200 bg-slate-50/50 p-1">
                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => onViewChange("grid")}
                            aria-label="Grid view"
                            className={cn(
                                "h-8 w-8 rounded-md",
                                view === "grid" ? "bg-white shadow-sm text-foreground" : "text-foreground-subtle hover:text-foreground-tertiary"
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
                                view === "list" ? "bg-white shadow-sm text-foreground" : "text-foreground-subtle hover:text-foreground-tertiary"
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
