"use client";

import type { Model } from "@esparex/shared";
import { CatalogModal } from "@/components/catalog/CatalogModal";
import { CatalogRejectSuggestionForm } from "@/components/catalog/CatalogUiPrimitives";

export function ModelsRejectModal({ model, reason, isSubmitting, onReasonChange, onClose, onConfirm }: {
    model: Model | null;
    reason: string;
    isSubmitting: boolean;
    onReasonChange: (v: string) => void;
    onClose: () => void;
    onConfirm: () => void;
}) {
    return (
        <CatalogModal isOpen={!!model} onClose={() => !isSubmitting && onClose()} title="Reject Model Suggestion">
            <CatalogRejectSuggestionForm
                itemName={model?.name}
                rejectionReason={reason}
                onRejectionReasonChange={onReasonChange}
                onCancel={onClose}
                onConfirm={() => void onConfirm()}
                isSubmitting={isSubmitting}
                placeholder="e.g. Duplicate entry, Invalid category, Spelled incorrectly..."
            />
        </CatalogModal>
    );
}
