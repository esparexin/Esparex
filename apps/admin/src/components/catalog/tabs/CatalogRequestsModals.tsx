"use client";

import type { CatalogRequestItem } from "@/lib/api/catalogRequests";
import { CatalogModal } from "@/components/catalog/CatalogModal";
import { CatalogRejectSuggestionForm } from "@/components/catalog/primitives";
import { CatalogBulkRejectModal, CatalogBulkDuplicateModal } from "@/components/catalog/CatalogBulkModals";
import { CatalogDeleteModal } from "@/components/catalog/CatalogDeleteModal";

interface CatalogRequestsModalsProps {
  rejectingRequest: CatalogRequestItem | null;
  setRejectingRequest: (req: CatalogRequestItem | null) => void;
  rejectionReason: string;
  setRejectionReason: (val: string) => void;
  isRejecting: boolean;
  confirmReject: () => void;

  deletingRequest: CatalogRequestItem | null;
  setDeletingRequest: (req: CatalogRequestItem | null) => void;
  isDeletingRequest: boolean;
  confirmSingleDelete: () => void;

  bulkRejectOpen: boolean;
  setBulkRejectOpen: (open: boolean) => void;
  selectedCount: number;
  bulkRejectionReason: string;
  setBulkRejectionReason: (val: string) => void;
  confirmBulkReject: () => void;
  isBulkRejecting: boolean;

  bulkDuplicateOpen: boolean;
  setBulkDuplicateOpen: (open: boolean) => void;
  requestType: "brand" | "model";
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  searching: boolean;
  searchResults: Array<{ id: string; name: string }>;
  selectedTargetId: string | null;
  setSelectedTargetId: (id: string | null) => void;
  confirmBulkDuplicate: () => void;
  isBulkDuplicating: boolean;

  bulkDeleteOpen: boolean;
  setBulkDeleteOpen: (open: boolean) => void;
  isBulkDeleting: boolean;
  confirmBulkDelete: () => void;
}

export function CatalogRequestsModals({
  rejectingRequest,
  setRejectingRequest,
  rejectionReason,
  setRejectionReason,
  isRejecting,
  confirmReject,
  deletingRequest,
  setDeletingRequest,
  isDeletingRequest,
  confirmSingleDelete,
  bulkRejectOpen,
  setBulkRejectOpen,
  selectedCount,
  bulkRejectionReason,
  setBulkRejectionReason,
  confirmBulkReject,
  isBulkRejecting,
  bulkDuplicateOpen,
  setBulkDuplicateOpen,
  requestType,
  searchQuery,
  setSearchQuery,
  searching,
  searchResults,
  selectedTargetId,
  setSelectedTargetId,
  confirmBulkDuplicate,
  isBulkDuplicating,
  bulkDeleteOpen,
  setBulkDeleteOpen,
  isBulkDeleting,
  confirmBulkDelete,
}: CatalogRequestsModalsProps) {
  return (
    <>
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
        selectedCount={selectedCount}
        rejectionReason={bulkRejectionReason}
        onRejectionReasonChange={setBulkRejectionReason}
        onConfirm={confirmBulkReject}
        isSubmitting={isBulkRejecting}
      />

      <CatalogBulkDuplicateModal
        isOpen={bulkDuplicateOpen}
        onClose={() => setBulkDuplicateOpen(false)}
        requestType={requestType}
        selectedCount={selectedCount}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        searching={searching}
        searchResults={searchResults}
        selectedTargetId={selectedTargetId}
        onSelectTarget={setSelectedTargetId}
        onConfirm={confirmBulkDuplicate}
        isSubmitting={isBulkDuplicating}
      />

      <CatalogDeleteModal
        isOpen={Boolean(deletingRequest)}
        itemName={deletingRequest?.requestedName || ""}
        isDeleting={isDeletingRequest}
        onClose={() => setDeletingRequest(null)}
        onConfirm={() => void confirmSingleDelete()}
      />

      <CatalogDeleteModal
        isOpen={bulkDeleteOpen}
        itemName={`${selectedCount} selected catalog requests`}
        isDeleting={isBulkDeleting}
        onClose={() => setBulkDeleteOpen(false)}
        onConfirm={() => void confirmBulkDelete()}
      />
    </>
  );
}
