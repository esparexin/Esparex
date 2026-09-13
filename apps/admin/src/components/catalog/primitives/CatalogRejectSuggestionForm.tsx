"use client";

import { AlertTriangle, Loader2, Button } from "@esparex/ui";

export function CatalogRejectSuggestionForm({
    itemName, rejectionReason, onRejectionReasonChange, onCancel, onConfirm, isSubmitting, placeholder,
}: {
    itemName?: string; rejectionReason: string; onRejectionReasonChange: (value: string) => void;
    onCancel: () => void; onConfirm: () => void; isSubmitting: boolean; placeholder: string;
}) {
    return (
        <div className="p-6 space-y-4">
            <div className="flex items-start gap-3 rounded-xl border border-orange-200 bg-orange-50 p-4">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-orange-600" />
                <div>
                    <p className="text-sm font-semibold text-orange-700">Rejection Action</p>
                    <p className="mt-1 text-sm text-orange-600">
                        You are rejecting <strong>&ldquo;{itemName}&rdquo;</strong>. Please provide a reason to notify the submitter.
                    </p>
                </div>
            </div>
            <div className="space-y-2">
                <label className="text-tiny font-bold uppercase tracking-wider text-foreground-tertiary">Rejection Reason</label>
                <textarea autoFocus value={rejectionReason} onChange={(e) => onRejectionReasonChange(e.target.value)}
                    placeholder={placeholder} className="w-full min-h-[100px] rounded-lg border border-input bg-background p-3 text-body text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 transition-all" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" disabled={isSubmitting} onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="button" variant="destructive" disabled={isSubmitting || !rejectionReason.trim()} onClick={onConfirm}>
                    {isSubmitting ? <><Loader2 size={14} className="animate-spin" /> Submitting&hellip;</> : "Confirm Rejection"}
                </Button>
            </div>
        </div>
    );
}
