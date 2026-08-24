"use client";

import { useState, useEffect } from "react";
import type { CatalogRequestItem } from "@/lib/api/catalogRequests";
import { getBrands } from "@/lib/api/brands";
import { getModels } from "@/lib/api/models";
import { parseAdminResponse } from "@/lib/api/parseAdminResponse";
import { showAdminPopup } from "@/lib/popup/popupEvents";

interface UseCatalogRequestsBulkActionsParams {
  requests: CatalogRequestItem[];
  handleReject: (id: string, reason: string) => Promise<void>;
  handleBulkReject: (ids: string[], reason: string) => Promise<void>;
  handleBulkMarkDuplicate: (ids: string[], targetId: string) => Promise<void>;
}

export function useCatalogRequestsBulkActions({
  requests,
  handleReject,
  handleBulkReject,
  handleBulkMarkDuplicate,
}: UseCatalogRequestsBulkActionsParams) {
  const [rejectingRequest, setRejectingRequest] = useState<CatalogRequestItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Bulk Reject state
  const [bulkRejectOpen, setBulkRejectOpen] = useState(false);
  const [bulkRejectionReason, setBulkRejectionReason] = useState("");
  const [isBulkRejecting, setIsBulkRejecting] = useState(false);

  // Bulk Duplicate state
  const [bulkDuplicateOpen, setBulkDuplicateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{ id: string; name: string }>>([]);
  const [searching, setSearching] = useState(false);
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [isBulkDuplicating, setIsBulkDuplicating] = useState(false);

  // Determine request type of selection to guide the duplicate catalog search
  const firstSelectedId = selectedIds[0];
  const firstSelectedRequest = requests.find((r) => r.id === firstSelectedId);
  const requestType = firstSelectedRequest?.requestType || "brand";

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const performSearch = async () => {
      setSearching(true);
      try {
        if (requestType === "brand") {
          const res = await getBrands({ search: searchQuery });
          const parsed = parseAdminResponse<{ id: string; name: string }>(res);
          setSearchResults(parsed.items.map((item) => ({ id: item.id, name: item.name })));
        } else {
          const res = await getModels({ search: searchQuery });
          const parsed = parseAdminResponse<{ id: string; name: string }>(res);
          setSearchResults(parsed.items.map((item) => ({ id: item.id, name: item.name })));
        }
      } catch (e) {
        showAdminPopup({
          type: "error",
          title: "Search Failed",
          message: e instanceof Error ? e.message : "Unable to complete catalog search.",
        });
      } finally {
        setSearching(false);
      }
    };
    const timer = setTimeout(performSearch, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, requestType]);

  const allSelected = requests.length > 0 && requests.every((item) => selectedIds.includes(item.id));
  const headerCheckedState = allSelected ? true : selectedIds.length > 0 ? ("indeterminate" as const) : false;

  const onToggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(requests.map((item) => item.id));
    } else {
      setSelectedIds([]);
    }
  };

  const onToggleSelect = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((x) => x !== id));
    }
  };

  const openBulkReject = () => {
    setBulkRejectionReason("");
    setBulkRejectOpen(true);
  };

  const openBulkDuplicate = () => {
    setSearchQuery("");
    setSearchResults([]);
    setSelectedTargetId(null);
    setBulkDuplicateOpen(true);
  };

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

  return {
    rejectingRequest,
    setRejectingRequest,
    rejectionReason,
    setRejectionReason,
    isRejecting,
    selectedIds,
    setSelectedIds,
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
  };
}
