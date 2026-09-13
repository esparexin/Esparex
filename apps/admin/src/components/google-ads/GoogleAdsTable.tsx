"use client";

import { Edit, Trash2, Tag, CheckCircle, AlertCircle, Monitor, Smartphone, Tablet, DataTable, type ColumnDef } from "@esparex/ui";
import { GOOGLE_AD_STATUS, type GoogleAdPlacementDTO } from "@esparex/contracts";

interface GoogleAdsTableProps {
    placements: GoogleAdPlacementDTO[];
    loading: boolean;
    onEdit: (placement: GoogleAdPlacementDTO) => void;
    onToggleStatus: (placement: GoogleAdPlacementDTO) => void;
    onDelete: (placement: GoogleAdPlacementDTO) => void;
    pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        pageSize: number;
        onPageChange: (page: number) => void;
    };
}

export function GoogleAdsTable({
    placements,
    loading,
    onEdit,
    onToggleStatus,
    onDelete,
    pagination,
}: GoogleAdsTableProps) {
    const columns: ColumnDef<GoogleAdPlacementDTO>[] = [
        {
            header: "Placement & Slot",
            cell: (row) => (
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0 border border-primary/20">
                        <Tag size={18} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-body font-bold text-foreground truncate">{row.name}</p>
                        <p className="font-mono text-tiny text-foreground-tertiary truncate">{row.placementKey} • Slot: <span className="font-semibold text-foreground-secondary">{row.adSlotId}</span></p>
                    </div>
                </div>
            ),
        },
        {
            header: "Target Location",
            cell: (row) => (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-tiny font-bold uppercase tracking-wider text-foreground-secondary">
                    {row.location.replace(/_/g, " ")}
                </span>
            ),
        },
        {
            header: "Format",
            cell: (row) => (
                <span className="font-mono text-caption font-semibold text-foreground-secondary bg-muted/40 px-2 py-0.5 rounded border border-border">
                    {row.format}
                </span>
            ),
        },
        {
            header: "Viewports",
            cell: (row) => (
                <div className="flex items-center gap-1.5 text-foreground-tertiary">
                    {row.viewports?.includes("desktop") && <span title="Desktop"><Monitor size={14} className="text-foreground-secondary" /></span>}
                    {row.viewports?.includes("tablet") && <span title="Tablet"><Tablet size={14} className="text-foreground-secondary" /></span>}
                    {row.viewports?.includes("mobile") && <span title="Mobile"><Smartphone size={14} className="text-foreground-secondary" /></span>}
                </div>
            ),
        },
        {
            header: "Status",
            cell: (row) => {
                const isActive = row.status === GOOGLE_AD_STATUS.ACTIVE;
                return (
                    <button
                        type="button"
                        onClick={() => onToggleStatus(row)}
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-tiny font-bold uppercase tracking-wider transition-all cursor-pointer ${
                            isActive
                                ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                                : "bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200"
                        }`}
                    >
                        {isActive ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                        {row.status}
                    </button>
                );
            },
        },
        {
            header: "Actions",
            className: "text-right",
            cell: (row) => (
                <div className="flex items-center justify-end gap-1">
                    <button
                        type="button"
                        onClick={() => onEdit(row)}
                        className="rounded-lg p-1.5 text-foreground-subtle hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                        title="Edit Placement"
                    >
                        <Edit size={16} />
                    </button>
                    <button
                        type="button"
                        onClick={() => onDelete(row)}
                        className="rounded-lg p-1.5 text-foreground-subtle hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
                        title="Delete Placement"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            ),
        },
    ];

    return (
        <DataTable
            data={placements}
            columns={columns}
            isLoading={loading}
            emptyMessage="No Google Ad placements found"
            enableColumnVisibility
            enableCsvExport
            csvFileName="google-ads-placements.csv"
            pagination={pagination}
        />
    );
}
