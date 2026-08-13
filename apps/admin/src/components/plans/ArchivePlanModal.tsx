"use client";

import { useState } from "react";
import { Plan } from "@esparex/contracts";
import { Archive, AlertTriangle, X } from "@esparex/ui";

interface ArchivePlanModalProps {
    plan: Plan | null;
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (planId: string, reason?: string) => Promise<{ success: boolean; error?: string }>;
    isMutating: boolean;
}

export function ArchivePlanModal({ plan, isOpen, onClose, onConfirm, isMutating }: ArchivePlanModalProps) {
    const [reason, setReason] = useState("");
    const [error, setError] = useState<string | null>(null);

    if (!isOpen || !plan) return null;

    const handleConfirm = async () => {
        setError(null);
        const result = await onConfirm(plan.id, reason.trim() || undefined);
        if (result.success) {
            setReason("");
            onClose();
        } else {
            setError(result.error ?? "Failed to archive plan. Please try again.");
        }
    };

    const handleClose = () => {
        if (isMutating) return;
        setReason("");
        setError(null);
        onClose();
    };

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="archive-plan-dialog-title"
            aria-describedby="archive-plan-dialog-desc"
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                aria-hidden="true"
                onClick={handleClose}
            />

            {/* Dialog */}
            <div className="relative z-10 w-full max-w-md rounded-xl bg-white shadow-2xl border border-slate-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
                            <Archive size={18} className="text-amber-600" aria-hidden="true" />
                        </div>
                        <h2
                            id="archive-plan-dialog-title"
                            className="text-base font-semibold text-slate-900"
                        >
                            Archive Plan
                        </h2>
                    </div>
                    <button
                        onClick={handleClose}
                        disabled={isMutating}
                        aria-label="Close archive plan dialog"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                        <X size={16} aria-hidden="true" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4" id="archive-plan-dialog-desc">
                    {/* Warning banner */}
                    <div className="flex gap-3 p-3 rounded-lg bg-amber-50 border border-amber-100">
                        <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0" aria-hidden="true" />
                        <div className="text-sm text-amber-800">
                            <p className="font-medium">This action will archive the plan.</p>
                            <p className="mt-0.5 text-amber-700">
                                Archived plans are hidden from active use but preserved in the database for
                                financial history and audit integrity. You can restore it at any time.
                            </p>
                        </div>
                    </div>

                    {/* Plan summary */}
                    <div className="rounded-lg bg-slate-50 border border-slate-100 p-3">
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Plan to Archive</p>
                        <p className="text-sm font-semibold text-slate-900">{plan.name}</p>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">{plan.code}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-slate-600">
                            <span>Type: <span className="font-medium">{plan.type.replace("_", " ")}</span></span>
                            <span>Price: <span className="font-medium">{plan.price === 0 ? "Free" : `${plan.currency} ${plan.price}`}</span></span>
                        </div>
                    </div>

                    {/* Reason input */}
                    <div>
                        <label
                            htmlFor="archive-reason"
                            className="block text-sm font-medium text-slate-700 mb-1.5"
                        >
                            Archive reason{" "}
                            <span className="text-slate-400 font-normal">(optional)</span>
                        </label>
                        <textarea
                            id="archive-reason"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            disabled={isMutating}
                            rows={2}
                            maxLength={200}
                            placeholder="e.g. Promotional campaign ended, superseded by new plan..."
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                            aria-describedby={error ? "archive-error" : undefined}
                        />
                        <p className="text-right text-xs text-slate-400 mt-0.5">{reason.length}/200</p>
                    </div>

                    {/* Error */}
                    {error && (
                        <div
                            id="archive-error"
                            role="alert"
                            aria-live="assertive"
                            className="flex gap-2 p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-700"
                        >
                            <AlertTriangle size={14} className="shrink-0 mt-0.5" aria-hidden="true" />
                            {error}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2 p-4 border-t border-slate-100">
                    <button
                        onClick={handleClose}
                        disabled={isMutating}
                        className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-slate-400"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => void handleConfirm()}
                        disabled={isMutating}
                        aria-busy={isMutating}
                        className="px-4 py-2 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 active:scale-95 rounded-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 flex items-center gap-2"
                    >
                        <Archive size={14} aria-hidden="true" />
                        {isMutating ? "Archiving…" : "Confirm Archive"}
                    </button>
                </div>
            </div>
        </div>
    );
}
