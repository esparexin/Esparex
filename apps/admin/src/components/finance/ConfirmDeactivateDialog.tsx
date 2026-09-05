"use client";

import { AlertTriangle, Loader2, Button } from "@esparex/ui";
import { CatalogModal } from "@/components/catalog/CatalogModal";

interface ConfirmDeactivateDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    isMutating: boolean;
    title: string;
    description: string;
}

export function ConfirmDeactivateDialog({ isOpen, onClose, onConfirm, isMutating, title, description }: ConfirmDeactivateDialogProps) {
    return (
        <CatalogModal
            isOpen={isOpen}
            onClose={() => !isMutating && onClose()}
            title={title}
        >
            <div className="p-6 space-y-4">
                <div className="flex items-start gap-4 p-4 bg-amber-50 rounded-xl border border-amber-200">
                    <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                        <h3 className="text-sm font-bold text-amber-900">Are you sure?</h3>
                        <p className="mt-1 text-sm text-amber-800 leading-relaxed">
                            {description}
                            <span className="block mt-2 font-semibold italic text-amber-900/60">Existing subscriptions will not be affected.</span>
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
                    >
                        {isMutating ? (
                            <><Loader2 size={16} className="animate-spin" /> Updating...</>
                        ) : (
                            "Yes, Deactivate Plan"
                        )}
                    </Button>
                </div>
            </div>
        </CatalogModal>
    );
}
