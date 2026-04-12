"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { AlertCircle, RefreshCcw, EyeOff, ChevronDown, Loader2 } from "lucide-react";
import { AdsTable } from "@/components/moderation/AdsTable";
import { RejectAdModal } from "@/components/moderation/RejectAdModal";
import { ViewAdModal } from "@/components/moderation/ViewAdModal";
import { AdminModuleTabs } from "@/components/layout/AdminModuleTabs";
import { AdminPageShell } from "@/components/layout/AdminPageShell";
import { AdminFilterToolbar } from "@/components/layout/AdminFilterToolbar";
import { moderationTabs } from "@/components/layout/adminModuleTabSets";
import { AdminErrorBoundary } from "@/components/common/AdminErrorBoundary";
import { getListingPresentation } from "@/components/moderation/listingPresentation";
import { CatalogModal } from "@/components/catalog/CatalogModal";

import { useAdFilters } from "./hooks/useAdFilters";
import { useAdSelection } from "./hooks/useAdSelection";
import { useAdTableData } from "./hooks/useAdTableData";
import { useAdActions } from "./hooks/useAdActions";
import { ModerationFilters } from "@/components/moderation/moderationTypes";

const SORT_OPTIONS: Array<{ label: string; value: ModerationFilters["sort"] }> = [
    { label: "Newest", value: "newest" },
    { label: "Oldest", value: "oldest" },
    { label: "Price High", value: "price_high" },
    { label: "Price Low", value: "price_low" }
];

type AdsViewProps = {
    mode?: "ads";
    listingType?: "ad" | "service" | "spare_part";
};

export default function AdsView({ mode = "ads", listingType }: AdsViewProps) {
    const presentation = getListingPresentation(listingType);
    const entityLabel = presentation.actionEntityLabel;
    const entityLabelPlural = presentation.actionEntityLabelPlural;

    const [refreshKey, setRefreshKey] = useState(0);
    const refresh = () => setRefreshKey((value) => value + 1);

    // ── Local UI State ─────────────────────────────────────────────────────────
    const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({
        select: true,
        image: true,
        details: true,
        seller: true,
        location: true,
        attribute: true,
        risk: true,
        status: true,
        created: true,
        actions: true
    });
    const [showColumnMenu, setShowColumnMenu] = useState(false);
    const columnMenuRef = useRef<HTMLDivElement>(null);

    // ── Modular Hooks ──────────────────────────────────────────────────────────
    const { 
        filters, page, pageSize, updateFilter, clearFilters, replaceRoute 
    } = useAdFilters(listingType);

    const { 
        items, pagination, summary, isLoading, error, moduleTabs, activeStatusOptions 
    } = useAdTableData({ filters, page, pageSize, refreshKey });

    const { 
        selectedIds, selectedCount, toggleSelect, toggleSelectAll, setSelectedIds 
    } = useAdSelection(items);

    const {
        viewAd, viewModalOpen, setViewModalOpen, viewLoading, viewError, handleView, setViewAd, setViewError,
        rejectModalOpen, setRejectModalOpen, rejectTitle, rejectTargetIds, isMutating, setRejectTargetIds, setRejectTitle,
        openSingleReject, openBulkReject, handleRejectSubmit,
        handleApprove, handleDeactivate, handleActivate, handleDelete, handleBanSeller, handleBulkApprove, handleBulkDelete,
        handleModalApprove, handleModalDeactivate, handleModalActivate, handleModalBlockSeller, handleModalExtend,
        // Added confirmations
        deleteModalOpen, setDeleteModalOpen, deleteTargetIds, deleteDisplayTitle, handleConfirmDelete,
        banModalOpen, setBanModalOpen, banTargetSellerName, handleConfirmBan,
    } = useAdActions({
        items,
        entityLabel,
        entityLabelPlural,
        refresh,
        selectedIds,
        setSelectedIds
    });

    // ── Sync: Page existence check ───────────────────────────────────────────
    useEffect(() => {
        if (page > pagination.pages && pagination.pages > 0) {
            replaceRoute({ page: pagination.pages });
        }
    }, [page, pagination.pages, replaceRoute]);

    // ── UI: Click outside column menu ────────────────────────────────────────
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (columnMenuRef.current && !columnMenuRef.current.contains(event.target as Node)) {
                setShowColumnMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const columnOptions = useMemo(() => [
        { id: "select", label: "Checkboxes" },
        { id: "image", label: "Image" },
        { id: "details", label: "Details" },
        { id: "seller", label: "Seller" },
        { id: "location", label: "Location" },
        { id: "attribute", label: presentation.attributeHeader },
        { id: "risk", label: "Risk" },
        { id: "status", label: "Status" },
        { id: "created", label: "Created" },
        { id: "actions", label: "Actions" },
    ], [presentation.attributeHeader]);

    return (
        <AdminPageShell
            headerVariant="compact"
            title={listingType ? presentation.pageTitle : "Listings"}
            tabs={
                <div className="flex flex-col gap-4 mb-2">
                    <AdminModuleTabs tabs={moderationTabs} variant="primary" />
                    <AdminModuleTabs tabs={moduleTabs} variant="pills" />
                </div>
            }
            actions={
                <div className="flex items-center gap-2">
                    <div className="relative" ref={columnMenuRef}>
                        <button
                            type="button"
                            onClick={() => setShowColumnMenu(!showColumnMenu)}
                            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all active:scale-95"
                        >
                            <EyeOff size={14} /> 
                            <span>Columns</span>
                            <ChevronDown size={12} className={`transition-transform duration-200 ${showColumnMenu ? "rotate-180" : ""}`} />
                        </button>
                        
                        {showColumnMenu && (
                            <div className="absolute right-0 top-full z-40 mt-2 min-w-[200px] rounded-xl border border-slate-200 bg-white p-2 shadow-xl animate-in fade-in zoom-in duration-200">
                                <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    Toggle Columns
                                </div>
                                <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                                    {columnOptions.map((opt) => (
                                        <label
                                            key={opt.id}
                                            className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors"
                                        >
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-200 cursor-pointer"
                                                checked={columnVisibility[opt.id] !== false}
                                                onChange={(e) => {
                                                    setColumnVisibility(prev => ({
                                                        ...prev,
                                                        [opt.id]: e.target.checked
                                                    }));
                                                }}
                                            />
                                            <span className="font-medium">{opt.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={refresh}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all active:scale-95"
                    >
                        <RefreshCcw size={14} /> 
                        <span>Refresh</span>
                    </button>
                </div>
            }
        >
            <div className="flex min-h-0 flex-1 flex-col gap-3">
                {/* Filter toolbar */}
                <AdminFilterToolbar
                    search={filters.search}
                    onSearchChange={(val) => updateFilter("search", val)}
                    searchPlaceholder="Search title, description, seller, phone"
                    status={filters.status}
                    onStatusChange={(val) => updateFilter("status", val as ModerationFilters["status"])}
                    statusOptions={activeStatusOptions}
                    extraFilters={
                        <>
                            <input
                                value={filters.sellerId}
                                onChange={(e) => updateFilter("sellerId", e.target.value)}
                                placeholder="Seller ID"
                                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200 w-32"
                            />
                            <input
                                value={filters.location}
                                onChange={(e) => updateFilter("location", e.target.value)}
                                placeholder="Location"
                                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200 w-28"
                            />
                            <select
                                value={filters.sort}
                                onChange={(e) => updateFilter("sort", e.target.value as ModerationFilters["sort"])}
                                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-200"
                            >
                                {SORT_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                            <input
                                type="date"
                                value={filters.dateFrom}
                                onChange={(e) => updateFilter("dateFrom", e.target.value)}
                                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200"
                            />
                            <input
                                type="date"
                                value={filters.dateTo}
                                onChange={(e) => updateFilter("dateTo", e.target.value)}
                                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200"
                            />
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                            >
                                Clear
                            </button>
                        </>
                    }
                />

                {error && (
                    <div className="flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-600">
                        <AlertCircle size={16} /> {error}
                    </div>
                )}

                <div className="min-h-0 flex-1">
                    <AdsTable
                        data={items}
                        listingType={listingType}
                        isLoading={isLoading}
                        emptyMessage={`No ${entityLabelPlural} matched current moderation filters`}
                        currentPage={page}
                        totalPages={pagination.pages}
                        totalItems={pagination.total}
                        pageSize={pagination.limit}
                        selectedIds={selectedIds}
                        onToggleSelect={toggleSelect}
                        onToggleSelectAll={toggleSelectAll}
                        onPageChange={(nextPage) => replaceRoute({ page: nextPage })}
                        onPageSizeChange={(size) => {
                            replaceRoute({ page: 1, limit: size });
                        }}
                        onView={handleView}
                        onApprove={(item) => void handleApprove(item)}
                        onReject={openSingleReject}
                        onDeactivate={(item) => void handleDeactivate(item)}
                        onActivate={(item) => void handleActivate(item)}
                        onDelete={(item) => void handleDelete(item)}
                        onBanSeller={(item) => void handleBanSeller(item)}
                        showCheckboxes={filters.status === 'pending'}
                        columnVisibility={columnVisibility}
                        onColumnVisibilityChange={setColumnVisibility}
                        hideColumnVisibilityButton={true}
                        bulkActions={
                            filters.status === 'pending' ? (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => void handleBulkApprove()}
                                        disabled={selectedCount === 0}
                                        className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        Approve Selected
                                    </button>
                                    <button
                                        type="button"
                                        onClick={openBulkReject}
                                        disabled={selectedCount === 0}
                                        className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        Reject Selected
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => void handleBulkDelete()}
                                        disabled={selectedCount === 0}
                                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        Delete Selected
                                    </button>
                                </>
                            ) : undefined
                        }
                    />
                </div>

                <AdminErrorBoundary fallbackLabel="Moderation Modal Error">
                    <RejectAdModal
                        open={rejectModalOpen}
                        title={rejectTitle}
                        entityLabel={entityLabel}
                        affectedCount={rejectTargetIds.length}
                        isSubmitting={isMutating}
                        onClose={() => {
                            setRejectModalOpen(false);
                            setRejectTargetIds([]);
                            setRejectTitle(undefined);
                        }}
                        onSubmit={handleRejectSubmit}
                    />

                    {/* Hardened Deletion Modal */}
                    <CatalogModal
                        isOpen={deleteModalOpen}
                        onClose={() => !isMutating && setDeleteModalOpen(false)}
                        title={`Delete ${entityLabelPlural}`}
                    >
                        <div className="p-6 space-y-4">
                            <div className="flex items-start gap-4 p-4 bg-red-50 rounded-xl border border-red-200">
                                <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                                <div>
                                    <h3 className="text-sm font-bold text-red-900">Permanent Action</h3>
                                    <p className="mt-1 text-sm text-red-800 leading-relaxed">
                                        Are you sure you want to delete {deleteTargetIds.length === 1 ? `"${deleteDisplayTitle || "this " + entityLabel}"` : `${deleteTargetIds.length} selected ${entityLabelPlural}`}? 
                                        This action cannot be undone and will remove all associated data.
                                    </p>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    disabled={isMutating}
                                    onClick={() => setDeleteModalOpen(false)}
                                    className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    disabled={isMutating}
                                    onClick={handleConfirmDelete}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-200"
                                >
                                    {isMutating ? <><Loader2 size={16} className="animate-spin" /> Deleting...</> : "Confirm Delete"}
                                </button>
                            </div>
                        </div>
                    </CatalogModal>

                    {/* Hardened Ban Modal */}
                    <CatalogModal
                        isOpen={banModalOpen}
                        onClose={() => !isMutating && setBanModalOpen(false)}
                        title="Block Seller"
                    >
                        <div className="p-6 space-y-4">
                            <div className="flex items-start gap-4 p-4 bg-amber-50 rounded-xl border border-amber-200">
                                <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                                <div>
                                    <h3 className="text-sm font-bold text-amber-900">Restrict Platform Access</h3>
                                    <p className="mt-1 text-sm text-amber-800 leading-relaxed">
                                        You are about to block <strong>{banTargetSellerName || "this seller"}</strong>. 
                                        They will be unable to post new {entityLabelPlural} or manage existing ones until globally reinstated by an admin.
                                    </p>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    disabled={isMutating}
                                    onClick={() => setBanModalOpen(false)}
                                    className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    disabled={isMutating}
                                    onClick={handleConfirmBan}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-bold hover:bg-amber-700 transition-all shadow-lg shadow-amber-200"
                                >
                                    {isMutating ? <><Loader2 size={16} className="animate-spin" /> Blocking...</> : "Block Seller"}
                                </button>
                            </div>
                        </div>
                    </CatalogModal>

                    <ViewAdModal
                        open={viewModalOpen}
                        ad={viewAd}
                        listingType={listingType}
                        loading={viewLoading}
                        error={viewError}
                        onClose={() => {
                            setViewModalOpen(false);
                            setViewAd(null);
                            setViewError("");
                        }}
                        onApprove={handleModalApprove}
                        onReject={(adId) => {
                            const ad = items.find((item) => item.id === adId) || viewAd;
                            if (ad) openSingleReject(ad);
                        }}
                        onDeactivate={handleModalDeactivate}
                        onActivate={handleModalActivate}
                        onBlockSeller={handleModalBlockSeller}
                        onExtend={handleModalExtend}
                    />
                </AdminErrorBoundary>
            </div>
        </AdminPageShell>
    );
}
