"use client";

import React, { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ArrowUpDown } from "lucide-react";
import { DataTableToolbar } from "./DataTableToolbar";
import { DataTableBody } from "./DataTableBody";
import { DataTablePagination } from "./DataTablePagination";

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
    columnVisibility?: Record<string, boolean>;
    onColumnVisibilityChange?: (visibility: Record<string, boolean>) => void;
    hideColumnVisibilityButton?: boolean;
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
    columnVisibility: controlledColumnVisibility,
    onColumnVisibilityChange,
    hideColumnVisibilityButton = false,
}: DataTableProps<T>) {
    const loadingRows = [1, 2, 3, 4, 5];

    const { currentPage = 1, totalPages = 1, totalItems = data.length, pageSize = 20, onPageChange } = pagination || {};
    const startItem = (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalItems);

    const parentRef = useRef<HTMLDivElement>(null);
    const [internalColumnVisibility, setInternalColumnVisibility] = React.useState<Record<string, boolean>>(() =>
        Object.fromEntries(
            columns.map((column, index) => [
                column.id || String(column.accessorKey || index),
                column.defaultVisible !== false,
            ])
        )
    );

    const columnVisibility = controlledColumnVisibility ?? internalColumnVisibility;
    const setColumnVisibility = (updater: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)) => {
        if (onColumnVisibilityChange) {
            const nextValue = typeof updater === "function" ? updater(columnVisibility) : updater;
            onColumnVisibilityChange(nextValue);
        } else {
            setInternalColumnVisibility(updater);
        }
    };


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
                    <DataTableToolbar
                        toolbar={toolbar}
                        bulkActions={bulkActions}
                        selectedCount={selectedCount}
                        enableColumnVisibility={enableColumnVisibility}
                        hideColumnVisibilityButton={hideColumnVisibilityButton}
                        columns={columns}
                        columnVisibility={columnVisibility}
                        setColumnVisibility={setColumnVisibility}
                        enableCsvExport={enableCsvExport}
                        exportCsv={exportCsv}
                    />
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
                            <DataTableBody
                                data={data}
                                virtualItems={virtualItems}
                                firstVirtualItem={firstVirtualItem}
                                lastVirtualItem={lastVirtualItem}
                                visibleColumns={visibleColumns}
                                rowVirtualizer={rowVirtualizer}
                                emptyMessage={emptyMessage}
                                onRowClick={onRowClick}
                            />
                        </table>
                    </div>

                    <DataTablePagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={totalItems}
                        startItem={startItem}
                        endItem={endItem}
                        dataLength={data.length}
                        onPageChange={onPageChange}
                    />
                </>
            )}
        </div>
    );
}
