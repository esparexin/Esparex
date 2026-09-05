"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAdminCatalogRequests } from "@/hooks/useAdminCatalogRequests";
import type { CatalogRequestItem } from "@/lib/api/catalogRequests";
import { CatalogPageTemplate } from "@/components/catalog/CatalogPageTemplate";
import { CatalogSelectFilter, CatalogSearchInput } from "@/components/catalog/primitives";
import { useCatalogQueryStateSync } from "@/hooks/useCatalogQueryStateSync";
import { normalizeSearchParamValue, parsePositiveIntParam } from "@/lib/urlSearchParams";
import { useCatalogRequestsBulkActions } from "./useCatalogRequestsBulkActions";
import { generateCatalogRequestsColumns } from "./CatalogRequestsColumns";
import { CatalogRequestsModals } from "./CatalogRequestsModals";

const REQUEST_STATUS_VALUES = new Set(["all", "pending", "approved", "rejected", "duplicate", "merged", "resolved"]);

const normalizeRequestStatusParam = (value: string | null) =>
  value && REQUEST_STATUS_VALUES.has(value) ? value : "all";

export default function CatalogRequestsTab() {
  const searchParams = useSearchParams();
  const initialSearch = normalizeSearchParamValue(searchParams.get("q") ?? searchParams.get("search"));
  const initialStatus = normalizeRequestStatusParam(searchParams.get("status"));
  const initialPage = parsePositiveIntParam(searchParams.get("page"), 1);

  const [searchInput, setSearchInput] = useState(initialSearch);

  const {
    requests,
    loading,
    error,
    handleApprove,
    handleReject,
    handleDelete,
    handleBulkReject,
    handleBulkMarkDuplicate,
    handleBulkDelete,
    pagination,
  } = useAdminCatalogRequests({
    initialFilters: {
      search: initialSearch,
      status: initialStatus,
    },
    initialPagination: {
      page: initialPage,
      limit: 20,
    },
  });

  const { replaceQueryState } = useCatalogQueryStateSync({
    searchInput,
    initialSearch,
    loading,
    initialPage,
    totalPages: pagination.totalPages,
  });

  const {
    rejectingRequest,
    setRejectingRequest,
    rejectionReason,
    setRejectionReason,
    isRejecting,
    deletingRequest,
    setDeletingRequest,
    isDeletingRequest,
    selectedIds,
    bulkRejectOpen,
    setBulkRejectOpen,
    bulkRejectionReason,
    setBulkRejectionReason,
    isBulkRejecting,
    bulkDuplicateOpen,
    setBulkDuplicateOpen,
    bulkDeleteOpen,
    setBulkDeleteOpen,
    isBulkDeleting,
    searchQuery,
    setSearchQuery,
    searchResults,
    searching,
    selectedTargetId,
    setSelectedTargetId,
    isBulkDuplicating,
    requestType,
    headerCheckedState,
    onToggleSelectAll,
    onToggleSelect,
    openBulkReject,
    openBulkDuplicate,
    openBulkDelete,
    confirmReject,
    confirmBulkReject,
    confirmBulkDuplicate,
    confirmSingleDelete,
    confirmBulkDelete,
  } = useCatalogRequestsBulkActions({
    requests,
    handleReject,
    handleBulkReject,
    handleBulkMarkDuplicate,
    handleDelete,
    handleBulkDelete,
  });

  const bulkActions = (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={openBulkReject}
        className="rounded-lg bg-amber-600 px-3 py-2 text-caption font-semibold text-white hover:bg-amber-700 transition-all shadow-xs cursor-pointer"
      >
        Quick Reject
      </button>
      <button
        type="button"
        onClick={openBulkDuplicate}
        className="rounded-lg bg-primary px-3 py-2 text-caption font-semibold text-primary-foreground hover:bg-primary/90 transition-all shadow-xs cursor-pointer"
      >
        Quick Duplicate
      </button>
      <button
        type="button"
        onClick={openBulkDelete}
        className="rounded-lg bg-destructive px-3 py-2 text-caption font-semibold text-destructive-foreground hover:bg-destructive/90 transition-all shadow-xs cursor-pointer"
      >
        Quick Delete
      </button>
    </div>
  );

  return (
    <>
      <CatalogPageTemplate<CatalogRequestItem, Record<string, never>>
        isNested={true}
        title="Catalog Requests"
        description="Manage user-submitted requests for new brands, models, or categories. Reviewing and approving these maintains the SSOT integrity."
        createLabel=""
        csvFileName="catalog-requests.csv"
        items={requests}
        loading={loading}
        error={error}
        pagination={pagination}
        selectedCount={selectedIds.length}
        bulkActions={selectedIds.length > 0 ? bulkActions : undefined}
        setPage={(page) => replaceQueryState({ page: page > 1 ? page : null })}
        handleCreate={async () => false}
        handleUpdate={async () => false}
        defaultFormData={{} as Record<string, never>}
        formRenderer={() => null}
        generateColumns={() =>
          generateCatalogRequestsColumns({
            headerCheckedState,
            onToggleSelectAll,
            selectedIds,
            onToggleSelect,
            handleApprove,
            onOpenRejectModal: (req) => {
              setRejectionReason("");
              setRejectingRequest(req);
            },
            onOpenDeleteModal: (req) => {
              setDeletingRequest(req);
            },
          })
        }
        filterLayoutClassName="md:grid-cols-2"
        filtersRenderer={
          <>
            <CatalogSearchInput
              value={searchInput}
              placeholder="Search requests..."
              onChange={setSearchInput}
            />
            <CatalogSelectFilter
              value={initialStatus}
              onChange={(status) =>
                replaceQueryState({
                  status: status !== "all" ? status : null,
                  page: null,
                })
              }
              options={[
                { value: "all", label: "All Status" },
                { value: "pending", label: "Pending" },
                { value: "approved", label: "Approved" },
                { value: "resolved", label: "Resolved" },
                { value: "rejected", label: "Rejected" },
                { value: "duplicate", label: "Duplicate" },
                { value: "merged", label: "Merged" },
              ]}
            />
          </>
        }
      />

      <CatalogRequestsModals
        rejectingRequest={rejectingRequest}
        setRejectingRequest={setRejectingRequest}
        rejectionReason={rejectionReason}
        setRejectionReason={setRejectionReason}
        isRejecting={isRejecting}
        confirmReject={confirmReject}
        deletingRequest={deletingRequest}
        setDeletingRequest={setDeletingRequest}
        isDeletingRequest={isDeletingRequest}
        confirmSingleDelete={confirmSingleDelete}
        bulkRejectOpen={bulkRejectOpen}
        setBulkRejectOpen={setBulkRejectOpen}
        selectedCount={selectedIds.length}
        bulkRejectionReason={bulkRejectionReason}
        setBulkRejectionReason={setBulkRejectionReason}
        confirmBulkReject={confirmBulkReject}
        isBulkRejecting={isBulkRejecting}
        bulkDuplicateOpen={bulkDuplicateOpen}
        setBulkDuplicateOpen={setBulkDuplicateOpen}
        requestType={requestType}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searching={searching}
        searchResults={searchResults}
        selectedTargetId={selectedTargetId}
        setSelectedTargetId={setSelectedTargetId}
        confirmBulkDuplicate={confirmBulkDuplicate}
        isBulkDuplicating={isBulkDuplicating}
        bulkDeleteOpen={bulkDeleteOpen}
        setBulkDeleteOpen={setBulkDeleteOpen}
        isBulkDeleting={isBulkDeleting}
        confirmBulkDelete={confirmBulkDelete}
      />
    </>
  );
}
