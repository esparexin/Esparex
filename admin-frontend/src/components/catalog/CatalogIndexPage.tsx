"use client";

import type { ReactNode } from "react";

import { AdminPageShell } from "@/components/layout/AdminPageShell";
import { DataTable, type ColumnDef } from "@/components/ui/DataTable";

const cn = (...values: Array<string | false | null | undefined>) => values.filter(Boolean).join(" ");

interface CatalogPaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    pageSize: number;
    onPageChange: (page: number) => void;
}

interface CatalogIndexPageProps<T extends { id: string | number }> {
    title: string;
    description: string;
    tabs: ReactNode;
    actions?: ReactNode;
    data: T[];
    columns: ColumnDef<T>[];
    isLoading?: boolean;
    emptyMessage: string;
    csvFileName: string;
    pagination: CatalogPaginationProps;
    filters?: ReactNode;
    filterLayoutClassName?: string;
    error?: string | null;
    className?: string;
    children?: ReactNode;
}

export function CatalogIndexPage<T extends { id: string | number }>({
    title,
    description,
    tabs,
    actions,
    data,
    columns,
    isLoading,
    emptyMessage,
    csvFileName,
    pagination,
    filters,
    filterLayoutClassName,
    error,
    className = "h-full overflow-y-auto pr-1",
    children,
}: CatalogIndexPageProps<T>) {
    return (
        <AdminPageShell
            title={title}
            description={description}
            tabs={tabs}
            actions={actions}
            className={className}
        >
            <>
                <div className="space-y-6">
                    {filters ? (
                        <div
                            className={cn(
                                "grid grid-cols-1 gap-4 items-center rounded-xl border border-slate-200 bg-white p-4 shadow-sm",
                                filterLayoutClassName
                            )}
                        >
                            {filters}
                        </div>
                    ) : null}

                    {error ? (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                            {error}
                        </div>
                    ) : null}

                    <DataTable
                        data={data}
                        columns={columns}
                        isLoading={isLoading}
                        emptyMessage={emptyMessage}
                        enableColumnVisibility
                        enableCsvExport
                        csvFileName={csvFileName}
                        pagination={pagination}
                    />
                </div>
                {children}
            </>
        </AdminPageShell>
    );
}
