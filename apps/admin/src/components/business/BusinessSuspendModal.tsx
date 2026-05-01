"use client";

import { Ban } from "lucide-react";
import { BusinessReasonModal } from "@/components/business/BusinessReasonModal";

interface BusinessSuspendModalProps {
    businessName: string;
    onClose: () => void;
    onConfirm: (reason: string) => Promise<void>;
}

export function BusinessSuspendModal({ businessName, onClose, onConfirm }: BusinessSuspendModalProps) {
    return (
        <BusinessReasonModal
            businessName={businessName}
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
            onClose={onClose}
            onConfirm={onConfirm}
        />
    );
}
