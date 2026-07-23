import React from "react";

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
