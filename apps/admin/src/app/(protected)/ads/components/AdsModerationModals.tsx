"use client";

import { AdminErrorBoundary } from "@/components/common/AdminErrorBoundary";
import { RejectAdModal } from "@/components/moderation/RejectAdModal";
import { ViewAdModal } from "@/components/moderation/ViewAdModal";
import { DeleteListingConfirmModal } from "./DeleteListingConfirmModal";
import { BanSellerConfirmModal } from "./BanSellerConfirmModal";
import type { ModerationItem } from "@/components/moderation/moderationTypes";

export interface AdsModerationModalsProps {
    listingType?: "ad" | "service" | "spare_part";
    entityLabel: string;
    entityLabelPlural: string;
    isMutating: boolean;
    // Reject
    rejectModalOpen: boolean;
    rejectTitle?: string;
    rejectTargetIds: string[];
    onCloseReject: () => void;
    onSubmitReject: (reason: string) => Promise<void>;
    // Delete
    deleteModalOpen: boolean;
    deleteTargetIds: string[];
    deleteDisplayTitle?: string;
    onCloseDelete: () => void;
    onConfirmDelete: () => Promise<void>;
    // Ban
    banModalOpen: boolean;
    targetSellerName?: string;
    onCloseBan: () => void;
    onConfirmBan: () => Promise<void>;
    // View
    viewModalOpen: boolean;
    viewAd: ModerationItem | null;
    viewLoading: boolean;
    viewError: string;
    onCloseView: () => void;
    onApproveView: (adId: string) => void;
    onRejectView: (adId: string) => void;
    onDeactivateView: (adId: string) => void;
    onActivateView: (adId: string) => void;
    onBlockSellerView: (sellerId: string) => void;
    onExtendView: (adId: string) => void;
}

export function AdsModerationModals({
    listingType,
    entityLabel,
    entityLabelPlural,
    isMutating,
    rejectModalOpen,
    rejectTitle,
    rejectTargetIds,
    onCloseReject,
    onSubmitReject,
    deleteModalOpen,
    deleteTargetIds,
    deleteDisplayTitle,
    onCloseDelete,
    onConfirmDelete,
    banModalOpen,
    targetSellerName,
    onCloseBan,
    onConfirmBan,
    viewModalOpen,
    viewAd,
    viewLoading,
    viewError,
    onCloseView,
    onApproveView,
    onRejectView,
    onDeactivateView,
    onActivateView,
    onBlockSellerView,
    onExtendView,
}: AdsModerationModalsProps) {
    return (
        <AdminErrorBoundary fallbackLabel="Moderation Modal Error">
            <RejectAdModal
                open={rejectModalOpen}
                title={rejectTitle}
                entityLabel={entityLabel}
                affectedCount={rejectTargetIds.length}
                isSubmitting={isMutating}
                onClose={onCloseReject}
                onSubmit={onSubmitReject}
            />

            <DeleteListingConfirmModal
                isOpen={deleteModalOpen}
                isMutating={isMutating}
                entityLabel={entityLabel}
                entityLabelPlural={entityLabelPlural}
                targetIds={deleteTargetIds}
                displayTitle={deleteDisplayTitle}
                onClose={onCloseDelete}
                onConfirm={onConfirmDelete}
            />

            <BanSellerConfirmModal
                isOpen={banModalOpen}
                isMutating={isMutating}
                entityLabelPlural={entityLabelPlural}
                targetSellerName={targetSellerName}
                onClose={onCloseBan}
                onConfirm={onConfirmBan}
            />

            <ViewAdModal
                open={viewModalOpen}
                ad={viewAd}
                listingType={listingType}
                loading={viewLoading}
                error={viewError}
                onClose={onCloseView}
                onApprove={onApproveView}
                onReject={onRejectView}
                onDeactivate={onDeactivateView}
                onActivate={onActivateView}
                onBlockSeller={onBlockSellerView}
                onExtend={onExtendView}
            />
        </AdminErrorBoundary>
    );
}
