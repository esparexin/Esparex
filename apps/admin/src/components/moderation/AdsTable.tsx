"use client";

import { useCallback, useMemo } from "react";
import { Checkbox, Image as ImageIcon, MapPin, ShieldAlert, DataTable, StatusChip, type ColumnDef } from "@esparex/ui";
import { AdminModerationActions } from "./AdminModerationActions";
import type { ModerationItem } from "./moderationTypes";
import { getListingAttribute, getListingPresentation, getListingPriceSummary } from "./listingPresentation";
import { ListingTypeValue } from "@esparex/contracts";
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
    return                               { label: "None", color: "text-foreground-subtle" };
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

const THUMBNAIL_FALLBACK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Crect width='120' height='120' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='12' fill='%2394a3b8'%3ENo Image%3C/text%3E%3C/svg%3E";

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
    onPageSizeChange: _onPageSizeChange,
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
    const headerCheckedState = allSelected
        ? true
        : selectedSet.size > 0
        ? "indeterminate"
        : false;
    const presentation = getListingPresentation(listingType);

    const renderAction = useCallback((item: ModerationItem) => (
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
    ), [onActivate, onApprove, onBanSeller, onDeactivate, onDelete, onReject, onView]);

    const columns: ColumnDef<ModerationItem>[] = useMemo(() => {
        const cols: ColumnDef<ModerationItem>[] = [];
        if (showCheckboxes) {
            cols.push({
                header: (
                    <Checkbox
                        checked={headerCheckedState}
                        onCheckedChange={(checked) => onToggleSelectAll(checked === true)}
                        aria-label={`Select all ${presentation.actionEntityLabelPlural}`}
                    />
                ),
                id: "select",
                className: "w-12",
                cell: (item) => (
                    <Checkbox
                        checked={selectedSet.has(item.id)}
                        onCheckedChange={(checked) => onToggleSelect(item.id, checked === true)}
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
                <div className="h-10 w-10 overflow-hidden rounded-md border border-border bg-muted shrink-0">
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
                            <ImageIcon size={16} className="text-foreground-subtle" />
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
                    <div className="font-semibold text-foreground text-sm truncate">{item.title}</div>
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-primary">
                            {getListingPriceSummary(item)}
                        </span>
                        {item.listingType && item.listingType !== "ad" && (
                            <span className={`text-tiny font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${
                                item.listingType === "service"
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-violet-100 text-violet-700"
                            }`}>
                                {item.listingType === "service" ? "SVC" : "PART"}
                            </span>
                        )}
                    </div>
                    <div className="text-tiny text-foreground-subtle truncate">
                        {item.categoryName || "-"} / {item.brandName || "-"} / {item.modelName || "-"}
                    </div>
                </div>
            )
        },
        {
            header: "Seller",
            id: "seller",
            cell: (item) => (
                <div className="space-y-0.5 text-xs text-foreground-secondary min-w-[130px]">
                    <div className="font-semibold text-foreground truncate">{item.sellerName || "Unknown"}</div>
                    <div>{item.sellerPhone || "—"}</div>
                    <div className="text-foreground-subtle text-tiny truncate max-w-[120px]">{item.sellerId || "-"}</div>
                </div>
            )
        },
        {
            header: "Location",
            id: "location",
            cell: (item) => {
                const geo = geoLevel(item);
                return (
                    <div className="flex flex-col gap-0.5 min-w-[140px]">
                        <div className="flex items-center gap-1.5 text-xs text-foreground-secondary">
                            <MapPin size={13} className="shrink-0 text-foreground-subtle" />
                            <span className="font-medium text-foreground truncate max-w-[130px]">{item.locationLabel || "Unknown"}</span>
                        </div>
                        <div className="pl-4">
                            <span className={`inline-flex rounded px-1.5 py-0.5 text-tiny font-bold uppercase tracking-wider ${geo.color} bg-muted/80`}>
                                {geo.label}
                            </span>
                        </div>
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
                    <div className="text-xs font-semibold text-foreground-secondary">
                        {attribute.value}
                    </div>
                );
            }
        },
        {
            header: "Risk",
            id: "risk",
            cell: (item) => (
                <div className="flex flex-col gap-1 min-w-[85px]">
                    <div className="flex items-center gap-1">
                        <span className={`inline-flex items-center gap-0.5 text-tiny font-bold px-1.5 py-0.5 rounded ${riskColor(item.fraudScore)}`}>
                            <ShieldAlert size={10} className="shrink-0" />
                            F:{item.fraudScore}
                        </span>
                        {item.riskScore != null && (
                            <span className={`inline-flex items-center text-tiny font-bold px-1.5 py-0.5 rounded ${riskColor(item.riskScore)}`}>
                                R:{item.riskScore}
                            </span>
                        )}
                    </div>
                    {item.reportCount > 0 && (
                        <span className="text-tiny text-rose-600 font-semibold">
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
                    <div className="text-xs text-foreground-secondary">
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
        headerCheckedState,
        onToggleSelectAll,
        selectedSet,
        onToggleSelect,
        renderAction,
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
