"use client";

import { useMemo } from "react";
import { Image as ImageIcon, MapPin, ShieldAlert } from "lucide-react";
import { AdminModerationActions } from "./AdminModerationActions";
import { StatusChip } from "@/components/ui/StatusChip";
import type { ModerationItem } from "./moderationTypes";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { getListingAttribute, getListingPresentation, getListingPriceSummary } from "./listingPresentation";
import type { ListingTypeValue } from "@shared/enums/listingType";

// ── Risk badge helpers ────────────────────────────────────────────────────────
const riskColor = (score: number) => {
    if (score >= 70) return "bg-red-100 text-red-700";
    if (score >= 40) return "bg-amber-100 text-amber-700";
    return "bg-emerald-100 text-emerald-700";
};

// ── Geo-precision level ───────────────────────────────────────────────────────
const geoLevel = (item: ModerationItem): { label: string; color: string } => {
    if (item.locationCoordinates) return { label: "GPS", color: "text-emerald-600" };
    if (item.locationLabel)       return { label: "Text", color: "text-amber-500" };
    return                               { label: "None", color: "text-slate-400" };
};

type AdsTableProps = {
    data: ModerationItem[];
    listingType?: ListingTypeValue;
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
    columnVisibility?: Record<string, boolean>;
    onColumnVisibilityChange?: (visibility: Record<string, boolean>) => void;
    hideColumnVisibilityButton?: boolean;
};

const THUMBNAIL_FALLBACK = "https://placehold.co/120x120/png?text=No+Image";

export function AdsTable({
    data,
    listingType,
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
    showCheckboxes = true,
    columnVisibility,
    onColumnVisibilityChange,
    hideColumnVisibilityButton
}: AdsTableProps) {
    const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
    const allSelected = data.length > 0 && data.every((item) => selectedSet.has(item.id));
    const presentation = getListingPresentation(listingType);

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
                        aria-label={`Select all ${presentation.actionEntityLabelPlural}`}
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
                        aria-label={`Select ${presentation.actionEntityLabel} ${item.title}`}
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
            header: presentation.tableDetailsHeader,
            id: "details",
            cell: (item) => (
                <div className="space-y-0.5 min-w-[180px] max-w-[280px]">
                    <div className="font-semibold text-slate-900 text-sm truncate">{item.title}</div>
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-primary">
                            {getListingPriceSummary(item)}
                        </span>
                        {item.listingType && item.listingType !== "ad" && (
                            <span className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${
                                item.listingType === "service"
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-violet-100 text-violet-700"
                            }`}>
                                {item.listingType === "service" ? "SVC" : "PART"}
                            </span>
                        )}
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
            cell: (item) => {
                const geo = geoLevel(item);
                return (
                    <div className="space-y-1 min-w-[150px]">
                        <div className="inline-flex items-start gap-1.5 text-xs text-slate-600">
                            <MapPin size={14} className="mt-0.5 shrink-0" />
                            <span className="line-clamp-2">{item.locationLabel || "Unknown location"}</span>
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${geo.color}`}>
                            {geo.label}
                        </span>
                    </div>
                );
            }
        },
        {
            header: presentation.attributeHeader,
            id: "attribute",
            cell: (item) => {
                const attribute = getListingAttribute(item, listingType);
                return (
                    <div className="text-xs font-semibold text-slate-700">
                        {attribute.value}
                    </div>
                );
            }
        },
        {
            header: "Risk",
            id: "risk",
            cell: (item) => (
                <div className="space-y-1.5 min-w-[80px]">
                    <div className="flex items-center gap-1">
                        <ShieldAlert size={11} className="text-slate-400 shrink-0" />
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${riskColor(item.fraudScore)}`}>
                            F {item.fraudScore}
                        </span>
                    </div>
                    {item.riskScore != null && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${riskColor(item.riskScore)}`}>
                            R {item.riskScore}
                        </span>
                    )}
                    {item.reportCount > 0 && (
                        <span className="text-[10px] text-slate-500 font-medium">
                            {item.reportCount} report{item.reportCount !== 1 ? "s" : ""}
                        </span>
                    )}
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
    }, [
        showCheckboxes,
        allSelected,
        onToggleSelectAll,
        selectedSet,
        onToggleSelect,
        onView,
        onApprove,
        onReject,
        onDeactivate,
        onActivate,
        onDelete,
        onBanSeller,
        presentation.tableDetailsHeader,
        presentation.attributeHeader,
        presentation.actionEntityLabel,
        presentation.actionEntityLabelPlural,
        listingType,
    ]);

    return (
        <DataTable
            data={data}
            columns={columns}
            isLoading={isLoading}
            emptyMessage={emptyMessage || "No listings found"}
            selectedCount={selectedSet.size}
            bulkActions={bulkActions}
            enableColumnVisibility
            hideColumnVisibilityButton={hideColumnVisibilityButton}
            columnVisibility={columnVisibility}
            onColumnVisibilityChange={onColumnVisibilityChange}
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
