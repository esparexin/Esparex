"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAdminCatalogRequests } from "@/hooks/useAdminCatalogRequests";
import type { CatalogRequestItem } from "@/lib/api/catalogRequests";
import { CatalogPageTemplate } from "@/components/catalog/CatalogPageTemplate";
import { CatalogModal } from "@/components/catalog/CatalogModal";
import {
  CatalogSelectFilter,
  CatalogRejectSuggestionForm,
  CatalogSearchInput,
} from "@/components/catalog/primitives";
import { useCatalogQueryStateSync } from "@/hooks/useCatalogQueryStateSync";
import { normalizeSearchParamValue, parsePositiveIntParam } from "@/lib/urlSearchParams";
import { CatalogBulkRejectModal, CatalogBulkDuplicateModal } from "@/components/catalog/CatalogBulkModals";
import { useCatalogRequestsBulkActions } from "./useCatalogRequestsBulkActions";
import { generateCatalogRequestsColumns } from "./CatalogRequestsColumns";

const REQUEST_STATUS_VALUES = new Set(["all", "pending", "approved", "rejected", "duplicate", "resolved"]);

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
    handleBulkReject,
    handleBulkMarkDuplicate,
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
    selectedIds,
    bulkRejectOpen,
    setBulkRejectOpen,
    bulkRejectionReason,
    setBulkRejectionReason,
    isBulkRejecting,
    bulkDuplicateOpen,
    setBulkDuplicateOpen,
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
    confirmReject,
    confirmBulkReject,
    confirmBulkDuplicate,
  } = useCatalogRequestsBulkActions({
    requests,
    handleReject,
    handleBulkReject,
    handleBulkMarkDuplicate,
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
              ]}
            />
          </>
        }
      />

      <CatalogModal
        isOpen={Boolean(rejectingRequest)}
        onClose={() => !isRejecting && setRejectingRequest(null)}
        title="Reject Catalog Request"
      >
        <CatalogRejectSuggestionForm
          itemName={rejectingRequest?.requestedName}
          rejectionReason={rejectionReason}
          onRejectionReasonChange={setRejectionReason}
          onCancel={() => setRejectingRequest(null)}
          onConfirm={() => void confirmReject()}
          isSubmitting={isRejecting}
          placeholder="e.g. Duplicate request, Already in catalog, Spam..."
        />
      </CatalogModal>

      <CatalogBulkRejectModal
        isOpen={bulkRejectOpen}
        onClose={() => setBulkRejectOpen(false)}
        selectedCount={selectedIds.length}
        rejectionReason={bulkRejectionReason}
        onRejectionReasonChange={setBulkRejectionReason}
        onConfirm={confirmBulkReject}
        isSubmitting={isBulkRejecting}
      />

      <CatalogBulkDuplicateModal
        isOpen={bulkDuplicateOpen}
        onClose={() => setBulkDuplicateOpen(false)}
        requestType={requestType}
        selectedCount={selectedIds.length}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        searching={searching}
        searchResults={searchResults}
        selectedTargetId={selectedTargetId}
        onSelectTarget={setSelectedTargetId}
        onConfirm={confirmBulkDuplicate}
        isSubmitting={isBulkDuplicating}
      />
    </>
  );
}
