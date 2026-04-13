"use client";

import type { ReactNode } from "react";
import { Eye, Pencil, Search, Trash2 } from "lucide-react";
import { DataTable, type ColumnDef } from "@/components/ui/DataTable";
import { BusinessAdminModals } from "@/components/business/BusinessAdminModals";
import type { BusinessAdminModalController } from "@/components/business/BusinessAdminModals";
import type { Business } from "@shared/types";

const STATUS_STYLES: Record<
    string,
    {
        pill: string;
        dot: string;
    }
> = {
    live: {
        pill: "bg-emerald-100 text-emerald-700 border-emerald-200",
        dot: "bg-emerald-500",
    },
    pending: {
        pill: "bg-amber-100 text-amber-700 border-amber-200",
        dot: "bg-amber-500 animate-pulse",
    },
    rejected: {
        pill: "bg-red-100 text-red-700 border-red-200",
        dot: "bg-red-500",
    },
    suspended: {
        pill: "bg-red-100 text-red-700 border-red-200",
        dot: "bg-red-500",
    },
    deleted: {
        pill: "bg-slate-100 text-slate-600 border-slate-200",
        dot: "bg-slate-400",
    },
};

export function BusinessStatusBadge({
    status,
    glowForLive = false,
}: {
    status: string;
    glowForLive?: boolean;
}) {
    const styles = STATUS_STYLES[status] ?? {
        pill: "bg-slate-100 text-slate-600 border-slate-200",
        dot: "bg-slate-400",
    };

    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${styles.pill}`}
        >
            <span
                className={`w-1.5 h-1.5 rounded-full ${styles.dot} ${
                    glowForLive && status === "live" ? "shadow-[0_0_6px_rgba(16,185,129,0.5)]" : ""
                }`}
            />
            {status}
        </span>
    );
}

const ACTION_TONES: Record<"default" | "primary" | "success" | "danger" | "warning", string> = {
    default: "hover:bg-slate-100 text-slate-400 hover:text-primary",
    primary: "hover:bg-blue-50 text-slate-400 hover:text-blue-600",
    success: "hover:bg-emerald-50 text-slate-400 hover:text-emerald-600",
    danger: "hover:bg-red-50 text-slate-400 hover:text-red-500",
    warning: "hover:bg-orange-50 text-slate-400 hover:text-orange-600",
};

export function BusinessActionButton({
    onClick,
    title,
    icon,
    tone = "default",
}: {
    onClick: () => void;
    title: string;
    icon: ReactNode;
    tone?: "default" | "primary" | "success" | "danger" | "warning";
}) {
    return (
        <button
            onClick={onClick}
            className={`p-1.5 rounded-lg transition-colors ${ACTION_TONES[tone]}`}
            title={title}
        >
            {icon}
        </button>
    );
}

export function BusinessSearchToolbar({
    search,
    onSearchChange,
    placeholder,
    summary,
    extraFilters,
    wrap = false,
    searchClassName = "relative flex-1 max-w-sm",
}: {
    search: string;
    onSearchChange: (value: string) => void;
    placeholder: string;
    summary: ReactNode;
    extraFilters?: ReactNode;
    wrap?: boolean;
    searchClassName?: string;
}) {
    return (
        <div
            className={`${wrap ? "flex flex-wrap" : "flex"} items-center gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm`}
        >
            <div className={searchClassName}>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                    type="text"
                    placeholder={placeholder}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    value={search}
                    onChange={(event) => onSearchChange(event.target.value)}
                />
            </div>
            {extraFilters}
            <div className={`${wrap ? "ml-auto" : ""} text-xs text-slate-400`}>{summary}</div>
        </div>
    );
}

export function BusinessTypesCell({
    businessTypes,
    max = 2,
}: {
    businessTypes?: string[];
    max?: number;
}) {
    return (
        <div className="text-xs text-slate-600 truncate max-w-[120px]">
            {(businessTypes ?? []).slice(0, max).join(", ") || "—"}
        </div>
    );
}

export function BusinessListTable({
    data,
    columns,
    isLoading,
    page,
    setPage,
    pagination,
    onRowClick,
    emptyMessage,
}: {
    data: Business[];
    columns: ColumnDef<Business>[];
    isLoading: boolean;
    page: number;
    setPage: (nextPage: number) => void;
    pagination: {
        pages: number;
        total: number;
    };
    onRowClick: (business: Business) => void;
    emptyMessage: string;
}) {
    return (
        <DataTable
            data={data}
            columns={columns}
            isLoading={isLoading}
            onRowClick={onRowClick}
            pagination={{
                currentPage: page,
                totalPages: pagination.pages,
                totalItems: pagination.total,
                pageSize: 20,
                onPageChange: setPage,
            }}
            emptyMessage={emptyMessage}
        />
    );
}

export function createBusinessStatusColumn(glowForLive = false): ColumnDef<Business> {
    return {
        header: "Status",
        cell: (business) => <BusinessStatusBadge status={business.status} glowForLive={glowForLive} />,
    };
}

export function createBusinessActionsColumn({
    onView,
    onEdit,
    onDelete,
    editTitle,
    deleteTitle,
    renderExtraActions,
    canEdit,
    canDelete,
}: {
    onView: (business: Business) => void;
    onEdit: (business: Business) => void;
    onDelete: (business: Business) => void;
    editTitle: string;
    deleteTitle: string;
    renderExtraActions?: (business: Business) => ReactNode;
    canEdit?: (business: Business) => boolean;
    canDelete?: (business: Business) => boolean;
}): ColumnDef<Business> {
    return {
        header: "Actions",
        id: "actions",
        cell: (business) => {
            const allowEdit = canEdit ? canEdit(business) : true;
            const allowDelete = canDelete ? canDelete(business) : true;

            return (
                <div className="flex items-center gap-1" onClick={(event) => event.stopPropagation()}>
                    <BusinessActionButton onClick={() => onView(business)} title="View Details" icon={<Eye size={15} />} />
                    {allowEdit ? (
                        <BusinessActionButton onClick={() => onEdit(business)} title={editTitle} tone="primary" icon={<Pencil size={15} />} />
                    ) : null}
                    {renderExtraActions?.(business)}
                    {allowDelete ? (
                        <BusinessActionButton onClick={() => onDelete(business)} title={deleteTitle} tone="danger" icon={<Trash2 size={15} />} />
                    ) : null}
                </div>
            );
        },
    };
}

export function buildBusinessModalController(
    businesses: Business[],
    controller: Omit<BusinessAdminModalController, "businesses">
): BusinessAdminModalController {
    return {
        businesses,
        ...controller,
    };
}

export function BusinessListModals({
    controller,
    onApproveFromDetails,
    deleteDescription,
    extraDialogs,
    onSuspendFromDetails,
    onActivateFromDetails,
}: {
    controller: BusinessAdminModalController;
    onApproveFromDetails: (business: Business) => void;
    deleteDescription: ReactNode;
    extraDialogs?: ReactNode;
    onSuspendFromDetails?: (business: Business) => void;
    onActivateFromDetails?: (id: string) => void;
}) {
    return (
        <BusinessAdminModals
            businesses={controller.businesses}
            selectedBusiness={controller.selectedBusiness}
            rejectTarget={controller.rejectTarget}
            modifyTarget={controller.modifyTarget}
            deleteTarget={controller.deleteTarget}
            setSelectedBusiness={controller.setSelectedBusiness}
            setRejectTarget={controller.setRejectTarget}
            setModifyTarget={controller.setModifyTarget}
            setDeleteTarget={controller.setDeleteTarget}
            handleReject={controller.handleReject}
            handleModify={controller.handleModify}
            handleDelete={controller.handleDelete}
            onApproveFromDetails={onApproveFromDetails}
            deleteDescription={deleteDescription}
            extraDialogs={extraDialogs}
            onSuspendFromDetails={onSuspendFromDetails}
            onActivateFromDetails={onActivateFromDetails}
        />
    );
}
