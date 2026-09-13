"use client";

import { AlertCircle, Button, Loader2 } from "@esparex/ui";
import { CatalogModal } from "@/components/catalog/CatalogModal";

export interface DeleteListingConfirmModalProps {
    isOpen: boolean;
    isMutating: boolean;
    entityLabel: string;
    entityLabelPlural: string;
    targetIds: string[];
    displayTitle?: string;
    onClose: () => void;
    onConfirm: () => void;
}

export function DeleteListingConfirmModal({
    isOpen,
    isMutating,
    entityLabel,
    entityLabelPlural,
    targetIds,
    displayTitle,
    onClose,
    onConfirm,
}: DeleteListingConfirmModalProps) {
    return (
        <CatalogModal
            isOpen={isOpen}
            onClose={() => !isMutating && onClose()}
            title={`Delete ${entityLabelPlural}`}
        >
            <div className="p-6 space-y-4">
                <div className="flex items-start gap-4 p-4 bg-destructive/10 rounded-xl border border-destructive/20">
                    <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                    <div>
                        <h3 className="text-body font-bold text-foreground">Permanent Action</h3>
                        <p className="mt-1 text-caption text-foreground-secondary leading-relaxed">
                            Are you sure you want to delete {targetIds.length === 1 ? `"${displayTitle || "this " + entityLabel}"` : `${targetIds.length} selected ${entityLabelPlural}`}? 
                            This action cannot be undone and will remove all associated data.
                        </p>
                    </div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                    <Button
                        type="button"
                        variant="outline"
                        disabled={isMutating}
                        onClick={onClose}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        disabled={isMutating}
                        onClick={onConfirm}
                        className="flex items-center gap-2"
                    >
                        {isMutating ? <><Loader2 size={16} className="animate-spin" /> Deleting...</> : "Confirm Delete"}
                    </Button>
                </div>
            </div>
        </CatalogModal>
    );
}
