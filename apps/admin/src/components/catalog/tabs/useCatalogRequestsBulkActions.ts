"use client";

import { useState } from "react";
import type { CatalogRequestItem } from "@/lib/api/catalogRequests";
import { showAdminPopup } from "@/lib/popup/popupEvents";
import { useCatalogRequestsBulkSearch } from "./useCatalogRequestsBulkSearch";
import { useCatalogRequestsSelection } from "./useCatalogRequestsSelection";

interface UseCatalogRequestsBulkActionsParams {
  requests: CatalogRequestItem[];
  handleReject: (id: string, reason: string) => Promise<void>;
  handleBulkReject: (ids: string[], reason: string) => Promise<void>;
  handleBulkMarkDuplicate: (ids: string[], targetId: string) => Promise<void>;
  handleDelete?: (id: string) => Promise<void>;
  handleBulkDelete?: (ids: string[]) => Promise<void>;
}

export function useCatalogRequestsBulkActions({
  requests,
  handleReject,
  handleBulkReject,
  handleBulkMarkDuplicate,
  handleDelete,
  handleBulkDelete,
}: UseCatalogRequestsBulkActionsParams) {
  const [rejectingRequest, setRejectingRequest] = useState<CatalogRequestItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);

  const [deletingRequest, setDeletingRequest] = useState<CatalogRequestItem | null>(null);
  const [isDeletingRequest, setIsDeletingRequest] = useState(false);

  const { selectedIds, setSelectedIds, headerCheckedState, onToggleSelectAll, onToggleSelect } =
    useCatalogRequestsSelection(requests);

  const [bulkRejectOpen, setBulkRejectOpen] = useState(false);
  const [bulkRejectionReason, setBulkRejectionReason] = useState("");
  const [isBulkRejecting, setIsBulkRejecting] = useState(false);

  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const [bulkDuplicateOpen, setBulkDuplicateOpen] = useState(false);
  const [isBulkDuplicating, setIsBulkDuplicating] = useState(false);

  const firstSelectedId = selectedIds[0];
  const firstSelectedRequest = requests.find((r) => r.id === firstSelectedId);
  const requestType = firstSelectedRequest?.requestType || "brand";

  const { searchQuery, setSearchQuery, searchResults, searching, selectedTargetId, setSelectedTargetId, resetSearch } =
    useCatalogRequestsBulkSearch({ requestType });

  const confirmReject = async () => {
    if (!rejectingRequest || !rejectionReason.trim()) return;
    setIsRejecting(true);
    await handleReject(rejectingRequest.id, rejectionReason.trim());
    setIsRejecting(false);
    setRejectingRequest(null);
    setRejectionReason("");
  };

  const confirmBulkReject = async () => {
    if (selectedIds.length === 0 || !bulkRejectionReason.trim()) return;
    setIsBulkRejecting(true);
    try {
      await handleBulkReject(selectedIds, bulkRejectionReason.trim());
      setSelectedIds([]);
      setBulkRejectOpen(false);
    } catch (e) {
      showAdminPopup({
        type: "error",
        title: "Bulk Reject Failed",
        message: e instanceof Error ? e.message : "Unable to reject selected requests.",
      });
    } finally {
      setIsBulkRejecting(false);
    }
  };

  const confirmBulkDuplicate = async () => {
    if (selectedIds.length === 0 || !selectedTargetId) return;
    setIsBulkDuplicating(true);
    try {
      await handleBulkMarkDuplicate(selectedIds, selectedTargetId);
      setSelectedIds([]);
      setBulkDuplicateOpen(false);
    } catch (e) {
      showAdminPopup({
        type: "error",
        title: "Mark Duplicate Failed",
        message: e instanceof Error ? e.message : "Unable to mark selected requests as duplicate.",
      });
    } finally {
      setIsBulkDuplicating(false);
    }
  };

  const confirmSingleDelete = async () => {
    if (!deletingRequest || !handleDelete) return;
    setIsDeletingRequest(true);
    try {
      await handleDelete(deletingRequest.id);
      setDeletingRequest(null);
    } catch (e) {
      showAdminPopup({
        type: "error",
        title: "Delete Failed",
        message: e instanceof Error ? e.message : "Unable to delete request.",
      });
    } finally {
      setIsDeletingRequest(false);
    }
  };

  const confirmBulkDelete = async () => {
    if (selectedIds.length === 0 || !handleBulkDelete) return;
    setIsBulkDeleting(true);
    try {
      await handleBulkDelete(selectedIds);
      setSelectedIds([]);
      setBulkDeleteOpen(false);
    } catch (e) {
      showAdminPopup({
        type: "error",
        title: "Bulk Delete Failed",
        message: e instanceof Error ? e.message : "Unable to delete selected requests.",
      });
    } finally {
      setIsBulkDeleting(false);
    }
  };

  return {
    rejectingRequest,
    setRejectingRequest,
    rejectionReason,
    setRejectionReason,
    isRejecting,
    deletingRequest,
    setDeletingRequest,
    isDeletingRequest,
    selectedIds,
    setSelectedIds,
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
    openBulkReject: () => {
      setBulkRejectionReason("");
      setBulkRejectOpen(true);
    },
    openBulkDuplicate: () => {
      resetSearch();
      setBulkDuplicateOpen(true);
    },
    openBulkDelete: () => setBulkDeleteOpen(true),
    confirmReject,
    confirmBulkReject,
    confirmBulkDuplicate,
    confirmSingleDelete,
    confirmBulkDelete,
  };
}
