import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../utils";

export interface PaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems?: number;
    pageSize?: number;
    onPageChange?: (page: number) => void;
    className?: string;
    itemLabel?: string;
    alwaysShow?: boolean;
}

export function Pagination({
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    onPageChange,
    className,
    itemLabel = "results",
    alwaysShow = false,
}: PaginationProps) {
    const effectivePageSize = pageSize && pageSize > 0 ? pageSize : 10;
    const effectiveTotal = totalItems !== undefined ? totalItems : 0;
    const effectiveTotalPages = Math.max(1, totalPages || Math.ceil(effectiveTotal / effectivePageSize));

    // When there are no items and alwaysShow is false, don't display anything
    if (totalItems !== undefined && totalItems === 0 && !alwaysShow) {
        return null;
    }

    // If totalPages <= 1, hide unless alwaysShow is explicitly true
    if (effectiveTotalPages <= 1 && !alwaysShow) {
        return null;
    }

    const startItem = effectiveTotal > 0 ? (currentPage - 1) * effectivePageSize + 1 : 0;
    const endItem = effectiveTotal > 0 ? Math.min(currentPage * effectivePageSize, effectiveTotal) : 0;

    return (
        <nav
            role="navigation"
            aria-label="Pagination"
            className={cn(
                "flex flex-col sm:flex-row items-center justify-between gap-3 text-caption text-foreground-secondary",
                className
            )}
        >
            {totalItems !== undefined && (
                <div className="text-caption text-foreground-secondary font-medium">
                    <span>
                        Showing <strong className="font-semibold text-foreground">{startItem}</strong> to{" "}
                        <strong className="font-semibold text-foreground">{endItem}</strong> of{" "}
                        <strong className="font-semibold text-foreground">{totalItems}</strong> {itemLabel}
                    </span>
                </div>
            )}

            <div className="flex items-center gap-1.5">
                <button
                    type="button"
                    onClick={() => onPageChange?.(Math.max(1, currentPage - 1))}
                    disabled={currentPage <= 1 || !onPageChange}
                    className="inline-flex items-center justify-center h-8 px-3 text-caption font-semibold rounded-lg border border-border bg-background text-foreground hover:bg-muted hover:text-primary disabled:opacity-40 disabled:pointer-events-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 cursor-pointer"
                    aria-label="Previous page"
                >
                    <ChevronLeft className="h-4 w-4 mr-1 shrink-0" aria-hidden="true" />
                    <span>Previous</span>
                </button>

                <span className="px-2 font-semibold text-foreground-secondary text-caption">
                    Page {currentPage} of {effectiveTotalPages}
                </span>

                <button
                    type="button"
                    onClick={() => onPageChange?.(Math.min(effectiveTotalPages, currentPage + 1))}
                    disabled={currentPage >= effectiveTotalPages || !onPageChange}
                    className="inline-flex items-center justify-center h-8 px-3 text-caption font-semibold rounded-lg border border-border bg-background text-foreground hover:bg-muted hover:text-primary disabled:opacity-40 disabled:pointer-events-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 cursor-pointer"
                    aria-label="Next page"
                >
                    <span>Next</span>
                    <ChevronRight className="h-4 w-4 ml-1 shrink-0" aria-hidden="true" />
                </button>
            </div>
        </nav>
    );
}
