"use client";

import type { ReactNode } from "react";

import { AdminPageShell } from "@/components/layout/AdminPageShell";
import { DataTable, cn, type ColumnDef } from "@esparex/ui";

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
    isNested?: boolean;
    children?: ReactNode;
    selectedCount?: number;
    bulkActions?: ReactNode;
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
    className = "",
    isNested,
    children,
    selectedCount,
    bulkActions,
}: CatalogIndexPageProps<T>) {
    return (
        <AdminPageShell
            title={isNested ? "" : title}
            description={isNested ? "" : description}
            tabs={tabs}
            actions={actions}
            showGlobalSearch={false}
            className={className}
            isNested={isNested}
        >
            <>
                <div className="space-y-6 pb-2">
                    {filters ? (
                        <div
                            className={cn(
                                "grid grid-cols-1 gap-4 items-center rounded-xl border border-border bg-card p-4 shadow-sm",
                                filterLayoutClassName
                            )}
                        >
                            {filters}
                        </div>
                    ) : null}

                    {error ? (
                        <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-body font-medium text-destructive">
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
                        selectedCount={selectedCount}
                        bulkActions={bulkActions}
                    />
                </div>
                {children}
            </>
        </AdminPageShell>
    );
}
