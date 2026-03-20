"use client";

import { useMemo } from "react";
import { Image as ImageIcon, MapPin } from "lucide-react";
import { AdminModerationActions } from "./AdminModerationActions";
import { StatusChip } from "@/components/ui/StatusChip";
import type { ModerationItem } from "./moderationTypes";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";

type AdsTableProps = {
    data: ModerationItem[];
    isLoading?: boolean;
    emptyMessage?: string;
    currentPage: number;
    totalPages: number;
    totalItems: number;
    pageSize: number;
    selectedIds: string[];
    onToggleSelect: (adId: string, checked: boolean) => void;
    onToggleSelectAll: (checked: boolean) => void;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
    onView: (ad: ModerationItem) => void;
    onApprove: (ad: ModerationItem) => void;
    onReject: (ad: ModerationItem) => void;
    onDeactivate: (ad: ModerationItem) => void;
    onActivate: (ad: ModerationItem) => void;
    onDelete: (ad: ModerationItem) => void;
    onBanSeller: (ad: ModerationItem) => void;
    bulkActions?: React.ReactNode;
    showCheckboxes?: boolean;
};

const THUMBNAIL_FALLBACK = "https://placehold.co/120x120/png?text=No+Image";

export function AdsTable({
    data,
    isLoading,
    emptyMessage,
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    selectedIds,
    onToggleSelect,
    onToggleSelectAll,
    onPageChange,
    onPageSizeChange,
    onView,
    onApprove,
    onReject,
    onDeactivate,
    onActivate,
    onDelete,
    onBanSeller,
    bulkActions,
    showCheckboxes = true
}: AdsTableProps) {
    const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
    const allSelected = data.length > 0 && data.every((item) => selectedSet.has(item.id));

    const renderAction = (item: ModerationItem) => (
        <AdminModerationActions
            status={item.status}
            onView={() => onView(item)}
            onApprove={() => onApprove(item)}
            onReject={() => onReject(item)}
            onDeactivate={() => onDeactivate(item)}
            onActivate={() => onActivate(item)}
            onDelete={() => onDelete(item)}
            onBlockSeller={item.sellerId ? () => onBanSeller(item) : undefined}
        />
    );

    const columns: ColumnDef<ModerationItem>[] = useMemo(() => {
        const cols: ColumnDef<ModerationItem>[] = [];
        if (showCheckboxes) {
            cols.push({
                header: (
                    <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={(e) => onToggleSelectAll(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/20"
                        aria-label="Select all ads"
                    />
                ),
                id: "select",
                className: "w-12",
                cell: (item) => (
                    <input
                        type="checkbox"
                        checked={selectedSet.has(item.id)}
                        onChange={(e) => onToggleSelect(item.id, e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/20"
                        aria-label={`Select ${item.title}`}
                    />
                )
            });
        }
        
        cols.push(
            {
                header: "Image",
                id: "image",
            className: "w-14",
            cell: (item) => (
                <div className="h-10 w-10 overflow-hidden rounded-md border border-slate-200 bg-slate-100 shrink-0">
                    {item.images[0] ? (
                        <img
                            src={item.images[0]}
                            alt=""
                            loading="lazy"
                            className="h-full w-full object-cover"
                            onError={(event) => {
                                event.currentTarget.src = THUMBNAIL_FALLBACK;
                            }}
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center">
                            <ImageIcon size={16} className="text-slate-400" />
                        </div>
                    )}
                </div>
            )
        },
        {
            header: "Ad Details",
            id: "details",
            cell: (item) => (
                <div className="space-y-0.5 min-w-[180px] max-w-[280px]">
                    <div className="font-semibold text-slate-900 text-sm truncate">{item.title}</div>
                    <div className="text-xs font-semibold text-primary">
                        {item.currency} {item.price.toLocaleString()}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                        {item.categoryName || "-"} / {item.brandName || "-"} / {item.modelName || "-"}
                    </div>
                </div>
            )
        },
        {
            header: "Seller",
            id: "seller",
            cell: (item) => (
                <div className="space-y-0.5 text-xs text-slate-700 min-w-[130px]">
                    <div className="font-semibold text-slate-900 truncate">{item.sellerName || "Unknown"}</div>
                    <div>{item.sellerPhone || "—"}</div>
                    <div className="text-slate-400 text-[10px] truncate max-w-[120px]">{item.sellerId || "-"}</div>
                </div>
            )
        },
        {
            header: "Location",
            id: "location",
            cell: (item) => (
                <div className="inline-flex items-start gap-1.5 text-xs text-slate-600 min-w-[150px]">
                    <MapPin size={14} className="mt-0.5 shrink-0" />
                    <span className="line-clamp-2">{item.locationLabel || "Unknown location"}</span>
                </div>
            )
        },
        {
            header: "Condition",
            id: "condition",
            cell: (item) => (
                <div className="text-xs font-semibold text-slate-700">
                    {item.devicePowerOn === false ? "Power Off" : "Working"}
                </div>
            )
        },
        {
            header: "Status",
            id: "status",
            cell: (item) => <StatusChip status={item.status} />
        },
        {
            header: "Created",
            id: "created",
            className: "min-w-[140px] whitespace-nowrap",
            cell: (item) => {
                const dateOpts: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' };
                return (
                    <div className="text-xs text-slate-600">
                        {new Date(item.createdAt).toLocaleDateString('en-GB', dateOpts)}
                    </div>
                );
            }
        },
        {
            header: "Actions",
            id: "actions",
            className: "text-right pr-6",
            cell: (item) => renderAction(item)
        }
        );
        return cols;
    }, [showCheckboxes, allSelected, onToggleSelectAll, selectedSet, onToggleSelect, onView, onApprove, onReject, onDeactivate, onActivate, onDelete, onBanSeller]);

    return (
        <DataTable
            data={data}
            columns={columns}
            isLoading={isLoading}
            emptyMessage={emptyMessage || "No ads found"}
            selectedCount={selectedSet.size}
            bulkActions={bulkActions}
            pagination={{
                currentPage,
                totalPages,
                totalItems,
                pageSize,
                onPageChange
            }}
        />
    );
}
