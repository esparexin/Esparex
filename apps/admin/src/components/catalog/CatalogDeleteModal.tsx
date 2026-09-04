"use client";

import { AlertTriangle, Loader2, Button } from "@esparex/ui";
import { CatalogModal } from "./CatalogModal";

interface CatalogDeleteModalProps {
    isOpen: boolean;
    itemName: string;
    isDeleting: boolean;
    onClose: () => void;
    onConfirm: () => void;
    customContent?: React.ReactNode;
}

export function CatalogDeleteModal({
    isOpen,
    itemName,
    isDeleting,
    onClose,
    onConfirm,
    customContent,
}: CatalogDeleteModalProps) {
    return (
        <CatalogModal
            isOpen={isOpen}
            onClose={() => !isDeleting && onClose()}
            title={`Delete`}
        >
            <div className="p-6 space-y-4">
                {customContent ? (
                    customContent
                ) : (
                    <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
                        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                        <div>
                            <p className="text-sm font-semibold text-red-700">Delete confirmation</p>
                            <p className="mt-1 text-sm text-red-600">
                                Are you sure you want to delete <strong>&ldquo;{itemName}&rdquo;</strong>?
                            </p>
                        </div>
                    </div>
                )}
                <div className="flex justify-end gap-3 pt-2">
                    <Button
                        type="button"
                        variant="outline"
                        disabled={isDeleting}
                        onClick={onClose}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        disabled={isDeleting}
                        onClick={onConfirm}
                    >
                        {isDeleting ? (
                            <><Loader2 size={14} className="animate-spin" /> Deleting…</>
                        ) : (
                            "Yes, Delete"
                        )}
                    </Button>
                </div>
            </div>
        </CatalogModal>
    );
}
