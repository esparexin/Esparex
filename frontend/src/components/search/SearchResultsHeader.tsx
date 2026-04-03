"use client";

import * as React from "react";
import { Button, buttonVariants } from "@/components/ui/button";
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
};

const SORT_LABELS = PUBLIC_BROWSE_SORT_LABELS;

const SORT_OPTIONS = Object.keys(SORT_LABELS) as SortOption[];

type SortDropdownTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    open: boolean;
    sort: SortOption;
    mobile?: boolean;
};

const SortDropdownTrigger = React.forwardRef<HTMLButtonElement, SortDropdownTriggerProps>(function SortDropdownTrigger({
    className,
    open,
    sort,
    mobile = false,
    type = "button",
    ...props
}, ref) {
    if (mobile) {
        return (
            <button
                ref={ref}
                type={type}
                aria-haspopup="menu"
                aria-expanded={open}
                aria-label={`Sort listings, current ${SORT_LABELS[sort]}`}
                className={cn(
                    buttonVariants({ variant: "outline" }),
                    "h-11 max-w-[10.5rem] shrink-0 gap-1.5 rounded-full border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-none hover:bg-slate-50",
                    className
                )}
                {...props}
            >
                <span className="truncate">{SORT_LABELS[sort]}</span>
                <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} />
            </button>
        );
    }

    return (
        <button
            ref={ref}
            type={type}
            aria-haspopup="menu"
            aria-expanded={open}
            aria-label="Sort listings"
            className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "h-10 shrink-0 gap-2 rounded-lg border-slate-200 bg-white px-3 shadow-sm hover:bg-slate-50",
                className
            )}
            {...props}
        >
            <SortAsc className="size-4 text-slate-400" />
            <span className="font-semibold text-slate-700 text-sm">{SORT_LABELS[sort]}</span>
            <ChevronDown className={cn("size-4 text-slate-400 transition-transform", open && "rotate-180")} />
        </button>
    );
});

type SortDropdownMenuProps = {
    sort: SortOption;
    onSelect: (value: SortOption) => void;
    mobile?: boolean;
};

function SortDropdownMenu({
    sort,
    onSelect,
    mobile = false,
}: SortDropdownMenuProps) {
    return (
        <DropdownMenuContent
            align={mobile ? "start" : "end"}
            sideOffset={8}
            className={cn(
                "rounded-xl border border-slate-100 p-1 shadow-xl",
                mobile ? "w-48" : "w-52"
            )}
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
                            : "text-slate-600 focus:bg-slate-50 focus:text-slate-700"
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
    mobile?: boolean;
};

function SortDropdown({
    open,
    onOpenChange,
    sort,
    onSelect,
    mobile = false,
}: SortDropdownProps) {
    return (
        <DropdownMenu open={open} onOpenChange={onOpenChange}>
            <DropdownMenuTrigger asChild>
                <SortDropdownTrigger
                    mobile={mobile}
                    open={open}
                    sort={sort}
                />
            </DropdownMenuTrigger>
            <SortDropdownMenu
                mobile={mobile}
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
}: SearchResultsHeaderProps) {
    const [mobileOpen, setMobileOpen] = React.useState(false);
    const [desktopOpen, setDesktopOpen] = React.useState(false);

    return (
        <div className="sticky top-[92px] md:top-0 z-20 bg-white/95 backdrop-blur-md mb-4 md:mb-0 md:border-b md:border-slate-100">
            {/* ── MOBILE LAYOUT ────────────────────────────────────────── */}
            <div className="md:hidden">
                <div className="border-b border-slate-100 px-3 py-3">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900">
                                {total} listing{total === 1 ? "" : "s"}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                                Sorted by {SORT_LABELS[sort]}
                                {activeFilterCount > 0 ? ` • ${activeFilterCount} filter${activeFilterCount === 1 ? "" : "s"} active` : ""}
                            </p>
                        </div>
                        <Button
                            size="icon"
                            variant="outline"
                            onClick={() => onViewChange(view === "grid" ? "list" : "grid")}
                            aria-label={view === "grid" ? "Switch to list view" : "Switch to grid view"}
                            className="h-10 w-10 flex-shrink-0 rounded-full border-slate-200 bg-white shadow-none"
                        >
                            {view === "grid"
                                ? <List className="size-4 text-slate-600" />
                                : <LayoutGrid className="size-4 text-slate-600" />}
                        </Button>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2 pb-1">
                        <div className="shrink-0">
                            {filterNode}
                        </div>
                        <SortDropdown
                            mobile
                            open={mobileOpen}
                            onOpenChange={(nextOpen) => {
                                setMobileOpen(nextOpen);
                                if (nextOpen) {
                                    setDesktopOpen(false);
                                }
                            }}
                            sort={sort}
                            onSelect={onSortChange}
                        />
                    </div>
                </div>
            </div>

            {/* ── DESKTOP LAYOUT ───────────────────────────────────────── */}
            <div className="hidden md:flex items-center justify-between gap-4 px-0 py-3 cursor-default">
                {/* LEFT: Result count */}
                <div className="flex items-center gap-2">
                    <span className={cn("size-2 rounded-full", total > 0 ? "bg-green-500 animate-pulse" : "bg-slate-300")} />
                    <p className="text-sm text-slate-500 font-medium whitespace-nowrap">
                        Showing <span className="text-slate-900">{total}</span> listing{total === 1 ? "" : "s"}
                        {activeFilterCount > 0 ? ` • ${activeFilterCount} filter${activeFilterCount === 1 ? "" : "s"} active` : ""}
                    </p>
                </div>

                {/* RIGHT: Controls */}
                <div className="flex items-center gap-2">
                    {/* Sort Dropdown */}
                    <SortDropdown
                        open={desktopOpen}
                        onOpenChange={(nextOpen) => {
                            setDesktopOpen(nextOpen);
                            if (nextOpen) {
                                setMobileOpen(false);
                            }
                        }}
                        sort={sort}
                        onSelect={onSortChange}
                    />

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
