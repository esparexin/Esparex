"use client";

import { AlertCircle, Button, Loader2 } from "@esparex/ui";
import { CatalogModal } from "@/components/catalog/CatalogModal";

export interface BanSellerConfirmModalProps {
    isOpen: boolean;
    isMutating: boolean;
    entityLabelPlural: string;
    targetSellerName?: string;
    onClose: () => void;
    onConfirm: () => void;
}

export function BanSellerConfirmModal({
    isOpen,
    isMutating,
    entityLabelPlural,
    targetSellerName,
    onClose,
    onConfirm,
}: BanSellerConfirmModalProps) {
    return (
        <CatalogModal
            isOpen={isOpen}
            onClose={() => !isMutating && onClose()}
            title="Block Seller"
        >
            <div className="p-6 space-y-4">
                <div className="flex items-start gap-4 p-4 bg-warning/10 rounded-xl border border-warning/20">
                    <AlertCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                    <div>
                        <h3 className="text-body font-bold text-foreground">Restrict Platform Access</h3>
                        <p className="mt-1 text-caption text-foreground-secondary leading-relaxed">
                            You are about to block <strong>{targetSellerName || "this seller"}</strong>. 
                            They will be unable to post new {entityLabelPlural} or manage existing ones until globally reinstated by an admin.
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
                        variant="primary"
                        disabled={isMutating}
                        onClick={onConfirm}
                        className="flex items-center gap-2 bg-warning text-warning-foreground hover:bg-warning/90"
                    >
                        {isMutating ? <><Loader2 size={16} className="animate-spin" /> Blocking...</> : "Block Seller"}
                    </Button>
                </div>
            </div>
        </CatalogModal>
    );
}
