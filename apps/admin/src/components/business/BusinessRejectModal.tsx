"use client";

import { XCircle } from "lucide-react";
import { BusinessReasonModal } from "@/components/business/BusinessReasonModal";

interface BusinessRejectModalProps {
    businessName: string;
    onClose: () => void;
    onConfirm: (reason: string) => Promise<void>;
}

export function BusinessRejectModal({ businessName, onClose, onConfirm }: BusinessRejectModalProps) {
    return (
        <BusinessReasonModal
            businessName={businessName}
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
            onClose={onClose}
            onConfirm={onConfirm}
        />
    );
}
