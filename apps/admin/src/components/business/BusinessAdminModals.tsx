"use client";

import type { Dispatch, ReactNode, SetStateAction } from "react";
import { BusinessDetailsModal } from "@/components/business/BusinessDetailsModal";
import { BusinessDeleteModal } from "@/components/business/BusinessDeleteModal";
import { BusinessModifyModal } from "@/components/business/BusinessModifyModal";
import { BusinessReasonModal } from "@/components/business/BusinessReasonModal";
import { XCircle, Ban } from "@esparex/ui";
import { Business } from "@esparex/contracts";

export interface BusinessAdminModalController {
    businesses: Business[];
    selectedBusiness: Business | null;
    rejectTarget: Business | null;
    modifyTarget: Business | null;
    deleteTarget: Business | null;
    suspendTarget?: Business | null;
    setSelectedBusiness: Dispatch<SetStateAction<Business | null>>;
    setRejectTarget: Dispatch<SetStateAction<Business | null>>;
    setModifyTarget: Dispatch<SetStateAction<Business | null>>;
    setDeleteTarget: Dispatch<SetStateAction<Business | null>>;
    setSuspendTarget?: Dispatch<SetStateAction<Business | null>>;
    handleReject: (id: string, reason: string) => Promise<void>;
    handleModify: (id: string, patch: Partial<Business>) => Promise<void>;
    handleDelete: (id: string) => Promise<void> | void;
    handleSuspend?: (id: string, reason: string) => Promise<void>;
}

interface BusinessAdminModalsProps extends BusinessAdminModalController {
    onApproveFromDetails: (business: Business) => void;
    deleteDescription: ReactNode;
    onSuspendFromDetails?: (business: Business) => void;
    onActivateFromDetails?: (id: string) => void;
    extraDialogs?: ReactNode;
}

const resolveBusiness = (businesses: Business[], id: string, fallback: Business) =>
    businesses.find((business) => business.id === id) ?? fallback;

export function BusinessAdminModals({
    businesses,
    selectedBusiness,
    rejectTarget,
    modifyTarget,
    deleteTarget,
    suspendTarget,
    setSelectedBusiness,
    setRejectTarget,
    setModifyTarget,
    setDeleteTarget,
    setSuspendTarget,
    handleReject,
    handleModify,
    handleDelete,
    handleSuspend,
    onApproveFromDetails,
    deleteDescription,
    onSuspendFromDetails,
    onActivateFromDetails,
    extraDialogs,
}: BusinessAdminModalsProps) {
    const handleSuspendFromDetails = onSuspendFromDetails && selectedBusiness
        ? (id: string) => onSuspendFromDetails(resolveBusiness(businesses, id, selectedBusiness))
        : undefined;

    return (
        <>
            {selectedBusiness && (
                <BusinessDetailsModal
                    business={selectedBusiness}
                    onClose={() => setSelectedBusiness(null)}
                    onApprove={(id) => onApproveFromDetails(resolveBusiness(businesses, id, selectedBusiness))}
                    onReject={(id) => setRejectTarget(resolveBusiness(businesses, id, selectedBusiness))}
                    onModify={(business) => setModifyTarget(business)}
                    onDelete={(id) => setDeleteTarget(resolveBusiness(businesses, id, selectedBusiness))}
                    onSuspend={handleSuspendFromDetails}
                    onActivate={onActivateFromDetails}
                />
            )}

            {extraDialogs}

            {suspendTarget && handleSuspend && setSuspendTarget && (
                <BusinessReasonModal
                    businessName={suspendTarget.name}
                    title="Suspend Business"
                    description="Temporarily suspend"
                    notice='Suspension is reversible. Use "Activate" to restore the business.'
                    label="Suspension Reason"
                    placeholder="e.g. Violation of terms of service, fraudulent reports, pending investigation..."
                    requiredMessage="Suspension reason is required."
                    submitLabel="Confirm Suspension"
                    submittingLabel="Suspending..."
                    failureMessage="Failed to suspend business"
                    icon={Ban}
                    tone="warning"
                    rows={3}
                    onClose={() => setSuspendTarget(null)}
                    onConfirm={(reason) => handleSuspend(suspendTarget.id, reason)}
                />
            )}

            {rejectTarget && (
                <BusinessReasonModal
                    businessName={rejectTarget.name}
                    title="Reject Business Application"
                    description="This action will reject"
                    notice="All associated listings will be expired upon rejection."
                    label="Rejection Reason"
                    placeholder="e.g. Incomplete documentation, duplicate registration, invalid GST number..."
                    requiredMessage="Rejection reason is required."
                    minLength={10}
                    minLengthMessage="Please provide a more descriptive reason (min 10 characters)."
                    submitLabel="Confirm Rejection"
                    submittingLabel="Rejecting..."
                    failureMessage="Failed to reject business"
                    icon={XCircle}
                    tone="danger"
                    rows={4}
                    onClose={() => setRejectTarget(null)}
                    onConfirm={(reason) => handleReject(rejectTarget.id, reason)}
                />
            )}

            {modifyTarget && (
                <BusinessModifyModal
                    business={modifyTarget}
                    onClose={() => setModifyTarget(null)}
                    onConfirm={(patch) => handleModify(modifyTarget.id, patch)}
                />
            )}

            {deleteTarget && (
                <BusinessDeleteModal
                    business={deleteTarget}
                    description={deleteDescription}
                    onClose={() => setDeleteTarget(null)}
                    onConfirm={handleDelete}
                />
            )}
        </>
    );
}
