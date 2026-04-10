"use client";

import { useState, useMemo } from "react";
import { useToast } from "@/context/ToastContext";
import { AdminApiError } from "@/lib/api/adminClient";
import { 
    type ModerationItem,
    type ModerationFilters
} from "@/components/moderation/moderationTypes";
import {
    activateAdminAd,
    approveAdminAd,
    blockAdminSeller,
    deactivateAdminAd,
    deleteAdminAd,
    extendAdminListing,
    fetchAdminAdDetail,
    rejectAdminAd
} from "@/lib/api/moderation";
import { normalizeModerationAd } from "@/components/moderation/normalizeModerationAd";

interface UseAdActionsProps {
    items: ModerationItem[];
    entityLabel: string;
    entityLabelPlural: string;
    refresh: () => void;
    selectedIds: string[];
    setSelectedIds: (ids: string[]) => void;
}

export function useAdActions({
    items,
    entityLabel,
    entityLabelPlural,
    refresh,
    selectedIds,
    setSelectedIds
}: UseAdActionsProps) {
    const { showToast } = useToast();

    // Modal States
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [viewAd, setViewAd] = useState<ModerationItem | null>(null);
    const [viewLoading, setViewLoading] = useState(false);
    const [viewError, setViewError] = useState("");

    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [rejectTargetIds, setRejectTargetIds] = useState<string[]>([]);
    const [rejectTitle, setRejectTitle] = useState<string | undefined>(undefined);
    const [rejectSubmitting, setRejectSubmitting] = useState(false);

    const lastRequestId = useMemo(() => ({ current: 0 }), []);

    const resolveActionErrorMessage = (actionError: unknown, fallbackMessage: string): string => {
        return AdminApiError.resolveMessage(actionError, fallbackMessage);
    };

    const withActionGuard = async (operation: () => Promise<void>, successMessage: string, fallbackError: string) => {
        try {
            await operation();
            showToast(successMessage, "success");
            refresh();
        } catch (actionError) {
            const message = resolveActionErrorMessage(actionError, fallbackError);
            showToast(message, "error");
        }
    };

    const resolveAdId = (item: ModerationItem) =>
        item.adId ||
        item.id ||
        (item as any).ad?._id ||
        (item as any).ad?.id;

    // Handlers
    const handleView = async (item: ModerationItem) => {
        const requestId = ++lastRequestId.current;
        const targetId = resolveAdId(item);

        setViewModalOpen(true);
        setViewAd(item);
        setViewLoading(true);
        setViewError("");

        try {
            const detail = await fetchAdminAdDetail(targetId);
            if (requestId !== lastRequestId.current) return;
            setViewAd(normalizeModerationAd(detail));
        } catch (detailError) {
            if (requestId !== lastRequestId.current) return;
            setViewError(detailError instanceof Error ? detailError.message : `Failed to load ${entityLabel} details`);
        } finally {
            if (requestId === lastRequestId.current) {
                setViewLoading(false);
            }
        }
    };

    const handleApprove = async (item: ModerationItem) => {
        await withActionGuard(
            () => approveAdminAd(item.id),
            `${entityLabel} approved`,
            `Failed to approve ${entityLabel}`
        );
    };

    const openSingleReject = (item: ModerationItem) => {
        setRejectTitle(item.title);
        setRejectTargetIds([item.id]);
        setRejectModalOpen(true);
    };

    const openBulkReject = () => {
        if (selectedIds.length === 0) return;
        setRejectTitle(undefined);
        setRejectTargetIds(selectedIds);
        setRejectModalOpen(true);
    };

    const handleRejectSubmit = async (reason: string) => {
        if (rejectTargetIds.length === 0) return;
        setRejectSubmitting(true);
        try {
            await Promise.all(rejectTargetIds.map((id) => rejectAdminAd(id, reason)));
            showToast(`Rejected ${rejectTargetIds.length} ${entityLabel}(s)`, "success");
            setRejectModalOpen(false);
            setRejectTargetIds([]);
            setRejectTitle(undefined);
            setSelectedIds([]);
            refresh();
        } catch (submitError) {
            const message = submitError instanceof Error ? submitError.message : `Failed to reject ${entityLabel}`;
            showToast(message, "error");
        } finally {
            setRejectSubmitting(false);
        }
    };

    const handleDeactivate = async (item: ModerationItem) => {
        await withActionGuard(
            () => deactivateAdminAd(item.id),
            `${entityLabel} deactivated`,
            `Failed to deactivate ${entityLabel}`
        );
    };

    const handleActivate = async (item: ModerationItem) => {
        await withActionGuard(
            () => activateAdminAd(item.id),
            `${entityLabel} activated`,
            `Failed to activate ${entityLabel}`
        );
    };

    const handleDelete = async (item: ModerationItem) => {
        const shouldDelete = window.confirm(`Delete ${entityLabel} \"${item.title}\"?`);
        if (!shouldDelete) return;
        await withActionGuard(
            () => deleteAdminAd(item.id),
            `${entityLabel} deleted`,
            `Failed to delete ${entityLabel}`
        );
    };

    const handleBanSeller = async (item: ModerationItem) => {
        if (!item.sellerId) return;
        const shouldBlock = window.confirm(`Block seller ${item.sellerName || item.sellerId}?`);
        if (!shouldBlock) return;

        await withActionGuard(
            () => blockAdminSeller(item.sellerId!, "Blocked via Ads Moderation"),
            "Seller blocked",
            "Failed to block seller"
        );
    };

    const handleBulkApprove = async () => {
        if (selectedIds.length === 0) return;
        await withActionGuard(
            async () => {
                await Promise.all(selectedIds.map((id) => approveAdminAd(id)));
                setSelectedIds([]);
            },
            `Approved ${selectedIds.length} ${entityLabel}(s)`,
            `Failed to bulk approve ${entityLabelPlural}`
        );
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        const shouldDelete = window.confirm(`Delete ${selectedIds.length} selected ${entityLabel}(s)?`);
        if (!shouldDelete) return;

        await withActionGuard(
            async () => {
                await Promise.all(selectedIds.map((id) => deleteAdminAd(id)));
                setSelectedIds([]);
            },
            `Deleted ${selectedIds.length} ${entityLabel}(s)`,
            `Failed to bulk delete ${entityLabelPlural}`
        );
    };

    // View Ad Modal Actions (Special because they update modal state too)
    const handleModalApprove = async (adId: string) => {
        await withActionGuard(
            () => approveAdminAd(adId),
            `${entityLabel} approved`,
            `Failed to approve ${entityLabel}`
        );
        try {
            const detail = await fetchAdminAdDetail(adId);
            setViewAd(normalizeModerationAd(detail));
        } catch { /* table already refreshed */ }
    };

    const handleModalDeactivate = async (adId: string) => {
        await withActionGuard(
            () => deactivateAdminAd(adId),
            `${entityLabel} deactivated`,
            `Failed to deactivate ${entityLabel}`
        );
        try {
            const detail = await fetchAdminAdDetail(adId);
            setViewAd(normalizeModerationAd(detail));
        } catch { /* table already refreshed */ }
    };

    const handleModalActivate = async (adId: string) => {
        await withActionGuard(
            () => activateAdminAd(adId),
            `${entityLabel} activated`,
            `Failed to activate ${entityLabel}`
        );
        try {
            const detail = await fetchAdminAdDetail(adId);
            setViewAd(normalizeModerationAd(detail));
        } catch { /* table already refreshed */ }
    };

    const handleModalBlockSeller = async (sellerId: string) => {
        await withActionGuard(
            () => blockAdminSeller(sellerId, "Blocked via Ads Moderation drawer"),
            "Seller blocked",
            "Failed to block seller"
        );
    };

    const handleModalExtend = async (adId: string) => {
        await withActionGuard(
            () => extendAdminListing(adId),
            `${entityLabel} expiry extended`,
            `Failed to extend ${entityLabel}`
        );
        try {
            const detail = await fetchAdminAdDetail(adId);
            setViewAd(normalizeModerationAd(detail));
        } catch { /* table already refreshed */ }
    };

    return {
        // View Modal
        viewAd,
        viewModalOpen,
        setViewModalOpen,
        viewLoading,
        viewError,
        handleView,
        setViewAd,
        setViewError,
        
        // Reject Modal
        rejectModalOpen,
        setRejectModalOpen,
        rejectTitle,
        rejectTargetIds,
        rejectSubmitting,
        setRejectTargetIds,
        setRejectTitle,
        openSingleReject,
        openBulkReject,
        handleRejectSubmit,

        // Handlers
        handleApprove,
        handleDeactivate,
        handleActivate,
        handleDelete,
        handleBanSeller,
        handleBulkApprove,
        handleBulkDelete,

        // Modal Specific
        handleModalApprove,
        handleModalDeactivate,
        handleModalActivate,
        handleModalBlockSeller,
        handleModalExtend,

        withActionGuard
    };
}
