"use client";

import React from "react";
import { AdminPageShell } from "@/components/layout/AdminPageShell";
import { AdminModuleTabs } from "@/components/layout/AdminModuleTabs";
import { financeTabs } from "@/components/layout/adminModuleTabSets";
import { DataTable, type ColumnDef } from "@/components/ui/DataTable";
import { AlertCircle } from "lucide-react";

interface FinancePageTemplateProps<T extends { id: string | number }> {
    title: string;
    description: string;
    
    // Stats Grid (Optional)
    stats?: React.ReactNode;
    
    // Filters (Optional)
    filters?: React.ReactNode;
    filterLayoutClassName?: string;
    
    // Action Buttons (Optional)
    actions?: React.ReactNode;
    
    // Data Table Props
    data: T[];
    columns: ColumnDef<T>[];
    isLoading: boolean;
    error?: string | null;
    emptyMessage?: string;
    
    // Pagination
    pagination?: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        pageSize: number;
        onPageChange: (page: number) => void;
    };
    
    // CSV Export
    enableCsvExport?: boolean;
    csvFileName?: string;
    
    // Column Visibility
    enableColumnVisibility?: boolean;
    
    // Children (for Modals, Extra content)
    children?: React.ReactNode;
    
    className?: string;
}

export function FinancePageTemplate<T extends { id: string | number }>({
    title,
    description,
    stats,
    filters,
    filterLayoutClassName = "flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm",
    actions,
    data,
    columns,
    isLoading,
    error,
    emptyMessage = "No records found",
    pagination,
    enableCsvExport = true,
    csvFileName = "finance-export.csv",
    enableColumnVisibility = true,
    children,
    className
}: FinancePageTemplateProps<T>) {
    return (
        <AdminPageShell
            title={title}
            description={description}
            tabs={<AdminModuleTabs tabs={financeTabs} />}
            actions={actions}
            className={className}
        >
            <div className="space-y-6">
                {/* Stats Section */}
                {stats && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {stats}
                    </div>
                )}

                {/* Filter Section */}
                {filters && (
                    <div className={filterLayoutClassName}>
                        {filters}
                    </div>
                )}

                {/* Error Banner */}
                {error && (
                    <div className="bg-red-50 border border-red-100 text-red-600 rounded-lg p-4 text-sm font-medium flex items-center gap-2">
                        <AlertCircle size={18} /> {error}
                    </div>
                )}

                {/* Data Table */}
                <div className="min-h-0 flex-1">
                    <DataTable
                        data={data}
                        columns={columns}
                        isLoading={isLoading}
                        emptyMessage={emptyMessage}
                        pagination={pagination}
                        enableCsvExport={enableCsvExport}
                        csvFileName={csvFileName}
                        enableColumnVisibility={enableColumnVisibility}
                    />
                </div>

                {/* Extra Content (Modals, etc.) */}
                {children}
            </div>
        </AdminPageShell>
    );
}
