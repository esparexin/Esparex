"use client";

import { AlertTriangle, Loader2 } from "@esparex/ui";
import { CatalogModal } from "./CatalogModal";
import { Textarea } from "@esparex/ui";

interface CatalogRejectModalProps {
    isOpen: boolean;
    itemName: string;
    isRejecting: boolean;
    reason: string;
    onReasonChange: (reason: string) => void;
    onClose: () => void;
    onConfirm: () => void;
}

export function CatalogRejectModal({
    isOpen,
    itemName,
    isRejecting,
    reason,
    onReasonChange,
    onClose,
    onConfirm,
}: CatalogRejectModalProps) {
    return (
        <CatalogModal
            isOpen={isOpen}
            onClose={() => !isRejecting && onClose()}
            title={`Reject`}
        >
            <div className="p-6 space-y-4">
                <div className="flex items-start gap-3 rounded-xl border border-orange-200 bg-orange-50 p-4">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-orange-600" />
                    <div>
                        <p className="text-sm font-semibold text-orange-700">Rejection confirmation</p>
                        <p className="mt-1 text-sm text-orange-600">
                            Please provide a reason for rejecting <strong>&ldquo;{itemName}&rdquo;</strong>.
                        </p>
                    </div>
                </div>

                <div>
                    <label className="mb-2 block text-sm font-semibold text-foreground">
                        Rejection Reason <span className="text-red-500">*</span>
                    </label>
                    <Textarea
                        value={reason}
                        onChange={(e) => onReasonChange(e.target.value)}
                        placeholder="Explain why this was rejected..."
                        className="min-h-[100px] resize-none"
                    />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <button
                        type="button"
                        disabled={isRejecting}
                        onClick={onClose}
                        className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-foreground-secondary hover:bg-slate-50 disabled:opacity-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        disabled={isRejecting || !reason.trim()}
                        onClick={onConfirm}
                        className="flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-60 transition-colors"
                    >
                        {isRejecting ? (
                            <><Loader2 size={14} className="animate-spin" /> Rejecting…</>
                        ) : (
                            "Confirm Rejection"
                        )}
                    </button>
                </div>
            </div>
        </CatalogModal>
    );
}
