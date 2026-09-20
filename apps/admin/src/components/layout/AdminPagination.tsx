"use client";

import { Pagination, type PaginationProps } from "@esparex/ui";

export type AdminPaginationProps = PaginationProps;

export function AdminPagination(props: AdminPaginationProps) {
    return (
        <Pagination
            {...props}
            itemLabel={props.itemLabel ?? "results"}
            className={props.className ?? "border-t border-border bg-card px-4 py-3"}
        />
    );
}

