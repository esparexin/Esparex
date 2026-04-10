import React from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

export interface DataTablePaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    startItem: number;
    endItem: number;
    dataLength: number;
    onPageChange?: (page: number) => void;
}

export function DataTablePagination({
    currentPage, totalPages, totalItems, startItem, endItem, dataLength, onPageChange
}: DataTablePaginationProps) {
    return (
        <div className="bg-white border-t border-slate-100 px-6 py-3 flex items-center justify-between mt-auto">
            <div className="text-xs text-slate-500 font-medium">
                Showing <span className="text-slate-900 font-bold">{dataLength > 0 ? startItem : 0}</span> to <span className="text-slate-900 font-bold">{dataLength > 0 ? endItem : 0}</span> of <span className="text-slate-900 font-bold">{totalItems}</span> results
            </div>

            {onPageChange && totalPages > 1 && (
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => onPageChange(1)}
                        disabled={currentPage === 1}
                        className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                        title="First Page"
                        aria-label="Go to first page"
                    >
                        <ChevronsLeft size={16} />
                    </button>
                    <button
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                        title="Previous Page"
                        aria-label="Go to previous page"
                    >
                        <ChevronLeft size={16} />
                    </button>

                    <div className="flex items-center px-4 h-8 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900">
                        Page {currentPage} of {totalPages}
                    </div>

                    <button
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                        title="Next Page"
                        aria-label="Go to next page"
                    >
                        <ChevronRight size={16} />
                    </button>
                    <button
                        onClick={() => onPageChange(totalPages)}
                        disabled={currentPage === totalPages}
                        className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                        title="Last Page"
                        aria-label="Go to last page"
                    >
                        <ChevronsRight size={16} />
                    </button>
                </div>
            )}
        </div>
    );
}
