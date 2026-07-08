"use client";

import { AlertTriangle, Loader2 } from "lucide-react";

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
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Rejection Reason</label>
                <textarea autoFocus value={rejectionReason} onChange={(e) => onRejectionReasonChange(e.target.value)}
                    placeholder={placeholder} className="w-full min-h-[100px] rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
                <button type="button" disabled={isSubmitting} onClick={onCancel}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors">Cancel</button>
                <button type="button" disabled={isSubmitting || !rejectionReason.trim()} onClick={onConfirm}
                    className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60 transition-colors">
                    {isSubmitting ? <><Loader2 size={14} className="animate-spin" /> Submitting&hellip;</> : "Confirm Rejection"}
                </button>
            </div>
        </div>
    );
}
