"use client";

import { ChevronLeft, ChevronRight } from "@esparex/ui";

export type AdminPaginationProps = {
    currentPage: number;
    totalPages: number;
    totalItems?: number;
    pageSize?: number;
    onPageChange: (page: number) => void;
    className?: string;
};

const cn = (...values: Array<string | false | null | undefined>) => values.filter(Boolean).join(" ");

export function AdminPagination({
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    onPageChange,
    className,
}: AdminPaginationProps) {
    if (totalPages <= 1 && totalItems === undefined) return null;

    const startItem = totalItems !== undefined && pageSize !== undefined
        ? Math.min((currentPage - 1) * pageSize + 1, totalItems)
        : null;
    const endItem = totalItems !== undefined && pageSize !== undefined
        ? Math.min(currentPage * pageSize, totalItems)
        : null;

    return (
        <nav
            role="navigation"
            aria-label="Pagination"
            className={cn(
                "flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 bg-white px-4 py-3 text-sm text-foreground-secondary",
                className
            )}
        >
            <div className="text-xs font-medium text-foreground-tertiary">
                {startItem !== null && endItem !== null && totalItems !== undefined ? (
                    <span>
                        Showing <strong className="font-semibold text-foreground">{startItem}</strong> to{" "}
                        <strong className="font-semibold text-foreground">{endItem}</strong> of{" "}
                        <strong className="font-semibold text-foreground">{totalItems}</strong> results
                    </span>
                ) : (
                    <span>
                        Page <strong className="font-semibold text-foreground">{currentPage}</strong> of{" "}
                        <strong className="font-semibold text-foreground">{Math.max(totalPages, 1)}</strong>
                    </span>
                )}
            </div>

            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-foreground-secondary transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Previous page"
                >
                    <ChevronLeft size={14} />
                    <span>Previous</span>
                </button>

                <span className="text-xs font-semibold text-foreground px-2">
                    {currentPage} / {Math.max(totalPages, 1)}
                </span>

                <button
                    type="button"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-foreground-secondary transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Next page"
                >
                    <span>Next</span>
                    <ChevronRight size={14} />
                </button>
            </div>
        </nav>
    );
}
