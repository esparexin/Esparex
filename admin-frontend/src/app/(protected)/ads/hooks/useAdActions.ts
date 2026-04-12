"use client";

import { useState, useMemo } from "react";
import { useToast } from "@/context/ToastContext";
import { AdminApiError } from "@/lib/api/adminClient";
import { 
    type ModerationItem,
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
import { useAdminMutation } from "@/hooks/useAdminMutation";

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

    const { isPending: isMutating, runMutation } = useAdminMutation();
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [rejectTargetIds, setRejectTargetIds] = useState<string[]>([]);
    const [rejectTitle, setRejectTitle] = useState<string | undefined>(undefined);

    // Hardened Confirmation States (Standardized Replacement for window.confirm)
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteTargetIds, setDeleteTargetIds] = useState<string[]>([]);
    const [deleteDisplayTitle, setDeleteDisplayTitle] = useState<string | undefined>(undefined);

    const [banModalOpen, setBanModalOpen] = useState(false);
    const [banTargetSellerId, setBanTargetSellerId] = useState<string | null>(null);
    const [banTargetSellerName, setBanTargetSellerName] = useState<string | undefined>(undefined);

    const lastRequestId = useMemo(() => ({ current: 0 }), []);

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
        return runMutation(
            () => approveAdminAd(item.id),
            {
                successMessage: `${entityLabel} approved`,
                failureMessage: `Failed to approve ${entityLabel}`,
                onSuccess: refresh
            }
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
        await runMutation(
            async () => {
                await Promise.all(rejectTargetIds.map((id) => rejectAdminAd(id, reason)));
            },
            {
                successMessage: `Rejected ${rejectTargetIds.length} ${entityLabel}(s)`,
                failureMessage: `Failed to reject ${entityLabel}`,
                onSuccess: () => {
                    setRejectModalOpen(false);
                    setRejectTargetIds([]);
                    setRejectTitle(undefined);
                    setSelectedIds([]);
                    refresh();
                }
            }
        );
    };

    const handleDeactivate = async (item: ModerationItem) => {
        await runMutation(
            () => deactivateAdminAd(item.id),
            {
                successMessage: `${entityLabel} deactivated`,
                failureMessage: `Failed to deactivate ${entityLabel}`,
                onSuccess: refresh
            }
        );
    };

    const handleActivate = async (item: ModerationItem) => {
        await runMutation(
            () => activateAdminAd(item.id),
            {
                successMessage: `${entityLabel} activated`,
                failureMessage: `Failed to activate ${entityLabel}`,
                onSuccess: refresh
            }
        );
    };

    // Replace window.confirm with state-triggered modals
    const openSingleDelete = (item: ModerationItem) => {
        setDeleteTargetIds([item.id]);
        setDeleteDisplayTitle(item.title);
        setDeleteModalOpen(true);
    };

    const openBulkDelete = () => {
        if (selectedIds.length === 0) return;
        setDeleteTargetIds(selectedIds);
        setDeleteDisplayTitle(undefined);
        setDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (deleteTargetIds.length === 0) return;
        await runMutation(
            async () => {
                await Promise.all(deleteTargetIds.map(id => deleteAdminAd(id)));
            },
            {
                successMessage: `${entityLabel}(s) deleted successfully`,
                failureMessage: `Failed to delete ${entityLabelPlural}`,
                onSuccess: () => {
                    setDeleteModalOpen(false);
                    setDeleteTargetIds([]);
                    setSelectedIds([]);
                    refresh();
                }
            }
        );
    };

    const openBanSellerModal = (item: ModerationItem) => {
        if (!item.sellerId) return;
        setBanTargetSellerId(item.sellerId);
        setBanTargetSellerName(item.sellerName || item.sellerId);
        setBanModalOpen(true);
    };

    const handleConfirmBan = async () => {
        if (!banTargetSellerId) return;
        await runMutation(
            () => blockAdminSeller(banTargetSellerId, "Blocked via Ads Moderation UX Hardening"),
            {
                successMessage: "Seller blocked successfully",
                failureMessage: "Failed to block seller",
                onSuccess: () => {
                    setBanModalOpen(false);
                    setBanTargetSellerId(null);
                    refresh();
                }
            }
        );
    };

    const handleBulkApprove = async () => {
        if (selectedIds.length === 0) return;
        await runMutation(
            async () => {
                await Promise.all(selectedIds.map((id) => approveAdminAd(id)));
            },
            {
                successMessage: `Approved ${selectedIds.length} ${entityLabel}(s)`,
                failureMessage: `Failed to bulk approve ${entityLabelPlural}`,
                onSuccess: () => {
                    setSelectedIds([]);
                    refresh();
                }
            }
        );
    };

    // View Ad Modal Actions (Special because they update modal state too)
    const handleModalApprove = async (adId: string) => {
        await runMutation(
            () => approveAdminAd(adId),
            {
                successMessage: `${entityLabel} approved`,
                failureMessage: `Failed to approve ${entityLabel}`,
                onSuccess: async () => {
                    refresh();
                    try {
                        const detail = await fetchAdminAdDetail(adId);
                        setViewAd(normalizeModerationAd(detail));
                    } catch { /* table already refreshed */ }
                }
            }
        );
    };

    const handleModalDeactivate = async (adId: string) => {
        await runMutation(
            () => deactivateAdminAd(adId),
            {
                successMessage: `${entityLabel} deactivated`,
                failureMessage: `Failed to deactivate ${entityLabel}`,
                onSuccess: async () => {
                    refresh();
                    try {
                        const detail = await fetchAdminAdDetail(adId);
                        setViewAd(normalizeModerationAd(detail));
                    } catch { /* table already refreshed */ }
                }
            }
        );
    };

    const handleModalActivate = async (adId: string) => {
        await runMutation(
            () => activateAdminAd(adId),
            {
                successMessage: `${entityLabel} activated`,
                failureMessage: `Failed to activate ${entityLabel}`,
                onSuccess: async () => {
                    refresh();
                    try {
                        const detail = await fetchAdminAdDetail(adId);
                        setViewAd(normalizeModerationAd(detail));
                    } catch { /* table already refreshed */ }
                }
            }
        );
    };

    const handleModalBlockSeller = async (sellerId: string) => {
        await runMutation(
            () => blockAdminSeller(sellerId, "Blocked via Ads Moderation drawer"),
            {
                successMessage: "Seller blocked",
                failureMessage: "Failed to block seller",
                onSuccess: refresh
            }
        );
    };

    const handleModalExtend = async (adId: string) => {
        await runMutation(
            () => extendAdminListing(adId),
            {
                successMessage: `${entityLabel} expiry extended`,
                failureMessage: `Failed to extend ${entityLabel}`,
                onSuccess: async () => {
                    refresh();
                    try {
                        const detail = await fetchAdminAdDetail(adId);
                        setViewAd(normalizeModerationAd(detail));
                    } catch { /* table already refreshed */ }
                }
            }
        );
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
        isMutating, // Refactored to unified mutation state
        setRejectTargetIds,
        setRejectTitle,
        openSingleReject,
        openBulkReject,
        handleRejectSubmit,

        // Hardened Confirmation States
        deleteModalOpen,
        setDeleteModalOpen,
        deleteTargetIds,
        deleteDisplayTitle,
        openSingleDelete,
        openBulkDelete,
        handleConfirmDelete,

        banModalOpen,
        setBanModalOpen,
        banTargetSellerName,
        openBanSellerModal,
        handleConfirmBan,

        // Handlers
        handleApprove,
        handleDeactivate,
        handleActivate,
        handleDelete: openSingleDelete,
        handleBanSeller: openBanSellerModal,
        handleBulkApprove,
        handleBulkDelete: openBulkDelete,

        // Modal Specific
        handleModalApprove,
        handleModalDeactivate,
        handleModalActivate,
        handleModalBlockSeller,
        handleModalExtend
    };
}
