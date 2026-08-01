"use client";

import * as React from "react";
import { buttonVariants } from "@esparex/ui";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ChevronDown, SortAsc } from "@/icons/IconRegistry";
import {
    PUBLIC_BROWSE_SORT_LABELS,
    type SortOption,
} from "@/lib/publicBrowseSort";

export type { SortOption } from "@/lib/publicBrowseSort";

type SearchResultsHeaderProps = {
    total: number;
    sort: SortOption;
    view?: "grid" | "list";
    onSortChange: (v: SortOption) => void;
    onViewChange?: (v: "grid" | "list") => void;
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
                "h-10 shrink-0 gap-1.5 rounded-full border-slate-200 bg-white px-3 shadow-none hover:bg-slate-50",
                className
            )}
            {...props}
        >
            <SortAsc className="size-4 text-foreground-subtle" />
            <span className="hidden sm:inline font-normal text-slate-700 text-xs sm:text-sm">{SORT_LABELS[sort]}</span>
            <ChevronDown className={cn("size-3.5 text-foreground-subtle transition-transform", open && "rotate-180")} />
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
    total: _total,
    sort,
    onSortChange,
    filterNode,
    categoryName,
}: SearchResultsHeaderProps) {
    const [sortOpen, setSortOpen] = React.useState(false);

    return (
        <div className="py-1 mb-2 border-none bg-transparent shadow-none">
            <div className="flex items-center justify-between gap-3">
                {/* Left side: Filter Trigger (Mobile only) & Category Title */}
                <div className="flex items-center gap-2.5 md:gap-3 min-w-0 flex-1">
                    {filterNode && <div className="shrink-0 lg:hidden">{filterNode}</div>}
                    {categoryName && (
                        <h2 className="hidden sm:block text-h4 font-bold text-slate-900 tracking-tight leading-none truncate">
                            {categoryName}
                        </h2>
                    )}
                </div>

                {/* Right side: SortDropdown instance */}
                <div className="flex items-center gap-2 md:gap-3 shrink-0">
                    <SortDropdown
                        open={sortOpen}
                        onOpenChange={setSortOpen}
                        sort={sort}
                        onSelect={onSortChange}
                    />
                </div>
            </div>
        </div>
    );
}
