import React from "react";
import { MoreHorizontal } from "lucide-react";
import { DataTableRow } from "./DataTableRow";

export interface DataTableBodyProps<T> {
    data: T[];
    virtualItems: any[];
    firstVirtualItem: any;
    lastVirtualItem: any;
    visibleColumns: any[];
    rowVirtualizer: any;
    emptyMessage: string;
    onRowClick?: (item: T) => void;
}

export function DataTableBody<T>({
    data, virtualItems, firstVirtualItem, lastVirtualItem, visibleColumns, rowVirtualizer, emptyMessage, onRowClick
}: DataTableBodyProps<T>) {
    return (
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
                            <DataTableRow
                                key={(item as any).id || virtualRow.index}
                                item={item}
                                virtualRow={virtualRow}
                                visibleColumns={visibleColumns}
                                measureElement={rowVirtualizer.measureElement}
                                onRowClick={onRowClick}
                            />
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
    );
}
