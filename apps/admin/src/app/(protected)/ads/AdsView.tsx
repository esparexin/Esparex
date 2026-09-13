"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, RefreshCcw, Button } from "@esparex/ui";
import { AdsTable } from "@/components/moderation/AdsTable";
import { AdminModuleTabs } from "@/components/layout/AdminModuleTabs";
import { AdminPageShell } from "@/components/layout/AdminPageShell";
import { AdminFilterToolbar } from "@/components/layout/AdminFilterToolbar";
import { moderationTabs } from "@/components/layout/adminModuleTabSets";
import { getListingPresentation } from "@/components/moderation/listingPresentation";

import { useAdFilters } from "./hooks/useAdFilters";
import { useAdSelection } from "./hooks/useAdSelection";
import { useAdTableData } from "./hooks/useAdTableData";
import { useAdActions } from "./hooks/useAdActions";
import { ModerationFilters } from "@/components/moderation/moderationTypes";

import { AdsColumnVisibilityMenu } from "./components/AdsColumnVisibilityMenu";
import { AdsFilterToolbarExtras } from "./components/AdsFilterToolbarExtras";
import { AdsBulkActionsBar } from "./components/AdsBulkActionsBar";
import { AdsModerationModals } from "./components/AdsModerationModals";

const allowed = new Set(["pending", "live", "rejected", "deactivated", "sold", "expired", "all"]);

type AdsViewProps = {
    mode?: "ads";
    listingType?: "ad" | "service" | "spare_part";
};

export default function AdsView({ listingType }: AdsViewProps) {
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

    // ── Modular Hooks ──────────────────────────────────────────────────────────
    const { 
        filters, page, pageSize, updateFilter, clearFilters, replaceRoute 
    } = useAdFilters(listingType);
    const normalizedStatus = allowed.has(filters.status) ? filters.status : "all";

    const { 
        items, pagination, isLoading, error, moduleTabs, activeStatusOptions 
    } = useAdTableData({ filters, page, pageSize, refreshKey });

    const { 
        selectedIds, selectedCount, toggleSelect, toggleSelectAll, setSelectedIds 
    } = useAdSelection(items);

    const {
        viewAd, viewModalOpen, setViewModalOpen, viewLoading, viewError, handleView, setViewAd, setViewError,
        rejectModalOpen, setRejectModalOpen, rejectTitle, rejectTargetIds, isMutating, setRejectTargetIds, setRejectTitle,
        openSingleReject, openBulkReject, handleRejectSubmit,
        handleApprove, handleDeactivate, handleActivate, handleDelete, handleBanSeller, 
        handleBulkApprove, handleBulkDelete, handleBulkDeactivate, handleBulkExpire, handleBulkExtend,
        handleBulkResendWarnings, handleBulkResendSpotlightWarnings,
        handleModalApprove, handleModalDeactivate, handleModalActivate, handleModalBlockSeller, handleModalExtend,
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
                    <AdsColumnVisibilityMenu
                        columnOptions={columnOptions}
                        columnVisibility={columnVisibility}
                        onChangeColumnVisibility={(id, visible) =>
                            setColumnVisibility((prev) => ({ ...prev, [id]: visible }))
                        }
                    />

                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={refresh}
                        className="gap-2 text-body font-medium text-foreground-secondary hover:bg-muted/50 transition-all active:scale-95 cursor-pointer"
                    >
                        <RefreshCcw size={14} /> 
                        <span>Refresh</span>
                    </Button>
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
                        <AdsFilterToolbarExtras
                            filters={filters}
                            updateFilter={updateFilter}
                            clearFilters={clearFilters}
                        />
                    }
                />

                {error && (
                    <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-body font-medium text-destructive">
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
                        showCheckboxes={true}
                        columnVisibility={columnVisibility}
                        onColumnVisibilityChange={setColumnVisibility}
                        hideColumnVisibilityButton={true}
                        bulkActions={
                            selectedCount > 0 ? (
                                <AdsBulkActionsBar
                                    status={filters.status}
                                    normalizedStatus={normalizedStatus}
                                    listingType={listingType}
                                    onBulkApprove={() => void handleBulkApprove()}
                                    onBulkReject={openBulkReject}
                                    onBulkDeactivate={() => void handleBulkDeactivate()}
                                    onBulkExpire={() => void handleBulkExpire()}
                                    onBulkExtend={() => void handleBulkExtend()}
                                    onBulkResendWarnings={() => void handleBulkResendWarnings()}
                                    onBulkResendSpotlightWarnings={() => void handleBulkResendSpotlightWarnings()}
                                    onBulkDelete={() => void handleBulkDelete()}
                                />
                            ) : undefined
                        }
                    />
                </div>

                <AdsModerationModals
                    listingType={listingType}
                    entityLabel={entityLabel}
                    entityLabelPlural={entityLabelPlural}
                    isMutating={isMutating}
                    rejectModalOpen={rejectModalOpen}
                    rejectTitle={rejectTitle}
                    rejectTargetIds={rejectTargetIds}
                    onCloseReject={() => { setRejectModalOpen(false); setRejectTargetIds([]); setRejectTitle(undefined); }}
                    onSubmitReject={handleRejectSubmit}
                    deleteModalOpen={deleteModalOpen}
                    deleteTargetIds={deleteTargetIds}
                    deleteDisplayTitle={deleteDisplayTitle}
                    onCloseDelete={() => setDeleteModalOpen(false)}
                    onConfirmDelete={handleConfirmDelete}
                    banModalOpen={banModalOpen}
                    targetSellerName={banTargetSellerName}
                    onCloseBan={() => setBanModalOpen(false)}
                    onConfirmBan={handleConfirmBan}
                    viewModalOpen={viewModalOpen}
                    viewAd={viewAd}
                    viewLoading={viewLoading}
                    viewError={viewError}
                    onCloseView={() => { setViewModalOpen(false); setViewAd(null); setViewError(""); }}
                    onApproveView={handleModalApprove}
                    onRejectView={(adId) => {
                        const ad = items.find((item) => item.id === adId) || viewAd;
                        if (ad) openSingleReject(ad);
                    }}
                    onDeactivateView={handleModalDeactivate}
                    onActivateView={handleModalActivate}
                    onBlockSellerView={handleModalBlockSeller}
                    onExtendView={handleModalExtend}
                />
            </div>
        </AdminPageShell>
    );
}
