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
                "h-10 shrink-0 gap-1.5 rounded-full border-border bg-card px-3 shadow-none hover:bg-muted cursor-pointer",
                className
            )}
            {...props}
        >
            <SortAsc className="size-4 text-foreground-subtle" />
            <span className="hidden sm:inline font-normal text-foreground-secondary text-caption sm:text-body">{SORT_LABELS[sort]}</span>
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
            className="w-52 rounded-xl border border-border p-1 shadow-xl bg-card"
        >
            {SORT_OPTIONS.map((key) => (
                <DropdownMenuItem
                    key={key}
                    onSelect={() => onSelect(key)}
                    aria-selected={sort === key}
                    className={cn(
                        "min-h-[44px] cursor-pointer rounded-lg px-3 py-2.5 text-body",
                        sort === key
                            ? "bg-primary text-primary-foreground font-medium focus:bg-primary focus:text-primary-foreground"
                            : "text-foreground-tertiary focus:bg-muted focus:text-foreground-secondary"
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
    onSortChange,
    filterNode,
    categoryName,
}: SearchResultsHeaderProps) {
    const [sortOpen, setSortOpen] = React.useState(false);

    return (
        <div className="py-0.5 mb-1.5 border-none bg-transparent shadow-none">
            <div className="flex items-center justify-between gap-3">
                {/* Left side: Filter Trigger (Mobile only) & Result Count / Category Title */}
                <div className="flex items-center gap-2.5 md:gap-3 min-w-0 flex-1">
                    {filterNode && <div className="shrink-0 lg:hidden">{filterNode}</div>}
                    {categoryName ? (
                        <h2 className="text-body-lg sm:text-h4 font-bold text-foreground tracking-tight leading-none truncate">
                            {categoryName}
                        </h2>
                    ) : typeof total === "number" && total > 0 ? (
                        <p className="text-small font-medium text-foreground-secondary tracking-tight">
                            Showing <span className="font-bold text-foreground">{total}</span> {total === 1 ? "ad" : "ads"}
                        </p>
                    ) : null}
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
