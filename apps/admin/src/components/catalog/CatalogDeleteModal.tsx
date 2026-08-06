"use client";

import { AlertTriangle, Loader2 } from "@esparex/ui";
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
                    <button
                        type="button"
                        disabled={isDeleting}
                        onClick={onClose}
                        className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-foreground-secondary hover:bg-slate-50 disabled:opacity-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        disabled={isDeleting}
                        onClick={onConfirm}
                        className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60 transition-colors"
                    >
                        {isDeleting ? (
                            <><Loader2 size={14} className="animate-spin" /> Deleting…</>
                        ) : (
                            "Yes, Delete"
                        )}
                    </button>
                </div>
            </div>
        </CatalogModal>
    );
}
