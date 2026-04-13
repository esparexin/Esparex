"use client";

import type { Dispatch, ReactNode, SetStateAction } from "react";
import { BusinessDetailsModal } from "@/components/business/BusinessDetailsModal";
import { BusinessDeleteModal } from "@/components/business/BusinessDeleteModal";
import { BusinessModifyModal } from "@/components/business/BusinessModifyModal";
import { BusinessRejectModal } from "@/components/business/BusinessRejectModal";
import type { Business } from "@shared/types";

export interface BusinessAdminModalController {
    businesses: Business[];
    selectedBusiness: Business | null;
    rejectTarget: Business | null;
    modifyTarget: Business | null;
    deleteTarget: Business | null;
    setSelectedBusiness: Dispatch<SetStateAction<Business | null>>;
    setRejectTarget: Dispatch<SetStateAction<Business | null>>;
    setModifyTarget: Dispatch<SetStateAction<Business | null>>;
    setDeleteTarget: Dispatch<SetStateAction<Business | null>>;
    handleReject: (id: string, reason: string) => Promise<void>;
    handleModify: (id: string, patch: Partial<Business>) => Promise<void>;
    handleDelete: (id: string) => Promise<void> | void;
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
    setSelectedBusiness,
    setRejectTarget,
    setModifyTarget,
    setDeleteTarget,
    handleReject,
    handleModify,
    handleDelete,
    onApproveFromDetails,
    deleteDescription,
    onSuspendFromDetails,
    onActivateFromDetails,
    extraDialogs,
}: BusinessAdminModalsProps) {
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
                    onSuspend={
                        onSuspendFromDetails
                            ? (id) => onSuspendFromDetails(resolveBusiness(businesses, id, selectedBusiness))
                            : undefined
                    }
                    onActivate={onActivateFromDetails}
                />
            )}

            {extraDialogs}

            {rejectTarget && (
                <BusinessRejectModal
                    businessName={rejectTarget.name}
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
