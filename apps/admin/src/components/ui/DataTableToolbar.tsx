import React, { useState } from "react";
import { EyeOff, Download } from "lucide-react";

export interface DataTableToolbarProps<T> {
    toolbar?: React.ReactNode;
    bulkActions?: React.ReactNode;
    selectedCount: number;
    enableColumnVisibility: boolean;
    hideColumnVisibilityButton: boolean;
    columns: any[];
    columnVisibility: Record<string, boolean>;
    setColumnVisibility: (updater: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)) => void;
    enableCsvExport: boolean;
    exportCsv: () => void;
}

export function DataTableToolbar<T>({
    toolbar, bulkActions, selectedCount, enableColumnVisibility, hideColumnVisibilityButton,
    columns, columnVisibility, setColumnVisibility, enableCsvExport, exportCsv
}: DataTableToolbarProps<T>) {
    const [showColumnsMenu, setShowColumnsMenu] = useState(false);

    if (!toolbar && !bulkActions && !enableColumnVisibility && !enableCsvExport) {
        return null;
    }

    return (
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
                {enableColumnVisibility && !hideColumnVisibilityButton && (
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
    );
}
