import React from "react";

export interface DataTableRowProps<T> {
    item: T;
    virtualRow: any;
    visibleColumns: any[];
    measureElement: (element: HTMLElement | null) => void;
    onRowClick?: (item: T) => void;
}

export function DataTableRow<T>({ item, virtualRow, visibleColumns, measureElement, onRowClick }: DataTableRowProps<T>) {
    return (
        <tr
            data-index={virtualRow.index}
            ref={measureElement}
            onClick={() => onRowClick?.(item)}
            className={`group/row transition-all duration-150 ${onRowClick ? "cursor-pointer hover:bg-slate-50" : "hover:bg-slate-50/50"}`}
        >
            {visibleColumns.map((col, idx) => (
                <td key={idx} className={`px-6 py-4 text-slate-700 font-medium ${col.className || ""}`}>
                    {col.cell ? col.cell(item) : (col.accessorKey ? String(item[col.accessorKey as keyof T]) : null)}
                </td>
            ))}
        </tr>
    );
}
