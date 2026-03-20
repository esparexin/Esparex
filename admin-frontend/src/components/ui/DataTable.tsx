"use client";

import React, { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    ArrowUpDown,
    MoreHorizontal,
    Download,
    EyeOff
} from "lucide-react";

export interface ColumnDef<T> {
    header: React.ReactNode;
    accessorKey?: keyof T;
    cell?: (item: T) => React.ReactNode;
    className?: string;
    id?: string;
    sortable?: boolean;
    exportValue?: (item: T) => string | number | null | undefined;
    defaultVisible?: boolean;
}

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    pageSize: number;
    onPageChange: (page: number) => void;
}

interface DataTableProps<T> {
    data: T[];
    columns: ColumnDef<T>[];
    isLoading?: boolean;
    emptyMessage?: string;
    onRowClick?: (item: T) => void;
    pagination?: PaginationProps;
    viewportClassName?: string;
    toolbar?: React.ReactNode;
    selectedCount?: number;
    bulkActions?: React.ReactNode;
    enableColumnVisibility?: boolean;
    enableCsvExport?: boolean;
    csvFileName?: string;
    onExportCsv?: () => void;
    sortState?: { columnId: string; direction: "asc" | "desc" } | null;
    onSortChange?: (columnId: string) => void;
}

export function DataTable<T extends { id: string | number }>({
    data,
    columns,
    isLoading,
    emptyMessage = "No data found",
    onRowClick,
    pagination,
    viewportClassName,
    toolbar,
    selectedCount = 0,
    bulkActions,
    enableColumnVisibility = false,
    enableCsvExport = false,
    csvFileName = "export.csv",
    onExportCsv,
    sortState,
    onSortChange,
}: DataTableProps<T>) {
    const loadingRows = [1, 2, 3, 4, 5];

    const { currentPage = 1, totalPages = 1, totalItems = data.length, pageSize = 20, onPageChange } = pagination || {};
    const startItem = (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalItems);

    const parentRef = useRef<HTMLDivElement>(null);
    const [columnVisibility, setColumnVisibility] = React.useState<Record<string, boolean>>(() =>
        Object.fromEntries(
            columns.map((column, index) => [
                column.id || String(column.accessorKey || index),
                column.defaultVisible !== false,
            ])
        )
    );
    const [showColumnsMenu, setShowColumnsMenu] = React.useState(false);

    const rowVirtualizer = useVirtualizer({
        count: data.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 56,
        overscan: 5,
    });

    const virtualItems = rowVirtualizer.getVirtualItems();
    const firstVirtualItem = virtualItems[0];
    const lastVirtualItem = virtualItems.length > 0 ? virtualItems[virtualItems.length - 1] : undefined;
    const visibleColumns = columns.filter((column, index) => {
        const key = column.id || String(column.accessorKey || index);
        return columnVisibility[key] !== false;
    });

    const exportCsv = () => {
        if (onExportCsv) {
            onExportCsv();
            return;
        }

        const headers = visibleColumns.map((column) => column.header);
        const rows = data.map((item) =>
            visibleColumns.map((column) => {
                const value = column.exportValue
                    ? column.exportValue(item)
                    : column.accessorKey
                        ? item[column.accessorKey]
                        : "";
                const normalized = value == null ? "" : String(value).replace(/"/g, '""');
                return `"${normalized}"`;
            })
        );

        const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = csvFileName;
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            {isLoading ? (
                <div className="w-full bg-white border border-slate-200 rounded-xl overflow-hidden animate-pulse">
                    <div className="h-12 bg-slate-50 border-b border-slate-100" />
                    {loadingRows.map((i) => (
                        <div key={i} className="h-16 border-b border-slate-50 mx-4" />
                    ))}
                </div>
            ) : (
                <>
                    {(toolbar || bulkActions || enableColumnVisibility || enableCsvExport) && (
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-4 py-3">
                            <div className="flex flex-wrap items-center gap-3">
                                {toolbar}
                                {bulkActions && selectedCount > 0 && (
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                                            {selectedCount} selected
                                        </span>
                                        {bulkActions}
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                {enableColumnVisibility && (
                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={() => setShowColumnsMenu((prev) => !prev)}
                                            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                            aria-label="Toggle column visibility menu"
                                        >
                                            <EyeOff size={14} /> Columns
                                        </button>
                                        {showColumnsMenu && (
                                            <div className="absolute right-0 top-full z-20 mt-2 min-w-[220px] rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                                                {columns.map((column, index) => {
                                                    const key = column.id || String(column.accessorKey || index);
                                                    return (
                                                        <label key={key} className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-slate-700 hover:bg-slate-50">
                                                            <input
                                                                type="checkbox"
                                                                checked={columnVisibility[key] !== false}
                                                                aria-label={`Toggle ${column.header} column`}
                                                                onChange={(event) =>
                                                                    setColumnVisibility((prev) => ({
                                                                        ...prev,
                                                                        [key]: event.target.checked,
                                                                    }))
                                                                }
                                                            />
                                                            <span>{column.header}</span>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}
                                {enableCsvExport && (
                                    <button
                                        type="button"
                                        onClick={exportCsv}
                                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                        aria-label="Export table as CSV"
                                    >
                                        <Download size={14} /> Export CSV
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                    <div
                        ref={parentRef}
                        className={`custom-scrollbar flex-1 min-h-0 overflow-auto ${viewportClassName || ""}`}
                    >
                        <table className="w-full text-left text-sm border-collapse min-w-[600px]">
                            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 sticky top-0 z-10">
                                <tr>
                                    {visibleColumns.map((col, idx) => (
                                        <th key={idx} className={`px-6 py-4 font-bold uppercase tracking-wider text-[10px] ${col.className || ""}`}>
                                            <button
                                                type="button"
                                                disabled={!col.sortable || !onSortChange}
                                                onClick={() => {
                                                    const columnId = col.id || String(col.accessorKey || idx);
                                                    if (col.sortable && onSortChange) onSortChange(columnId);
                                                }}
                                                className={`flex items-center gap-2 group transition-colors ${col.sortable && onSortChange ? "cursor-pointer hover:text-slate-900" : "cursor-default"}`}
                                                aria-label={col.sortable && onSortChange ? `Sort by ${col.header}` : undefined}
                                            >
                                                {col.header}
                                                <ArrowUpDown
                                                    size={12}
                                                    className={`transition-opacity ${
                                                        sortState && (col.id || String(col.accessorKey || idx)) === sortState.columnId
                                                            ? "opacity-100 text-slate-900"
                                                            : "opacity-0 group-hover:opacity-100"
                                                    }`}
                                                />
                                            </button>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {data.length > 0 ? (
                                    <>
                                        {firstVirtualItem && firstVirtualItem.start > 0 && (
                                            <tr>
                                                <td colSpan={visibleColumns.length} style={{ height: firstVirtualItem.start }} />
                                            </tr>
                                        )}
                                        {virtualItems.map((virtualRow) => {
                                            const item = data[virtualRow.index];
                                            if (!item) return null;
                                            return (
                                                <tr
                                                    key={item.id}
                                                    data-index={virtualRow.index}
                                                    ref={rowVirtualizer.measureElement}
                                                    onClick={() => onRowClick?.(item)}
                                                    className={`group/row transition-all duration-150 ${onRowClick ? "cursor-pointer hover:bg-slate-50" : "hover:bg-slate-50/50"}`}
                                                >
                                                    {visibleColumns.map((col, idx) => (
                                                        <td key={idx} className={`px-6 py-4 text-slate-700 font-medium ${col.className || ""}`}>
                                                            {col.cell ? col.cell(item) : (col.accessorKey ? String(item[col.accessorKey]) : null)}
                                                        </td>
                                                    ))}
                                                </tr>
                                            );
                                        })}
                                        {lastVirtualItem && lastVirtualItem.end < rowVirtualizer.getTotalSize() && (
                                            <tr>
                                                <td colSpan={visibleColumns.length} style={{ height: rowVirtualizer.getTotalSize() - lastVirtualItem.end }} />
                                            </tr>
                                        )}
                                    </>
                                ) : (
                                    <tr>
                                        <td colSpan={visibleColumns.length} className="px-6 py-12 text-center text-slate-400 font-medium bg-slate-50/10">
                                            <div className="flex flex-col items-center gap-2">
                                                <MoreHorizontal size={32} className="text-slate-200" />
                                                {emptyMessage}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Footer */}
                    <div className="bg-white border-t border-slate-100 px-6 py-3 flex items-center justify-between mt-auto">
                        <div className="text-xs text-slate-500 font-medium">
                            Showing <span className="text-slate-900 font-bold">{data.length > 0 ? startItem : 0}</span> to <span className="text-slate-900 font-bold">{data.length > 0 ? endItem : 0}</span> of <span className="text-slate-900 font-bold">{totalItems}</span> results
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
                </>
            )}
        </div>
    );
}
