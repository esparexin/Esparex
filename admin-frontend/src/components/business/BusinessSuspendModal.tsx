"use client";

import { useState } from "react";
import { Ban, AlertTriangle } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";

interface BusinessSuspendModalProps {
    businessName: string;
    onClose: () => void;
    onConfirm: (reason: string) => Promise<void>;
}

export function BusinessSuspendModal({ businessName, onClose, onConfirm }: BusinessSuspendModalProps) {
    const [reason, setReason] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async () => {
        const trimmed = reason.trim();
        if (!trimmed) {
            setError("Suspension reason is required.");
            return;
        }
        setLoading(true);
        setError("");
        try {
            await onConfirm(trimmed);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to suspend business");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent className="max-w-md rounded-2xl p-0 overflow-hidden">
                <DialogHeader className="p-6 border-b border-slate-100 bg-orange-50/60">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                            <Ban size={20} />
                        </div>
                        <div>
                            <DialogTitle className="text-base font-bold text-slate-900">Suspend Business</DialogTitle>
                            <DialogDescription className="text-xs text-slate-500 mt-0.5">
                                Temporarily suspend <span className="font-semibold text-slate-700">{businessName}</span>. The owner will be notified.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-6 space-y-4">
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
                        <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                        Suspension is reversible. Use &quot;Activate&quot; to restore the business.
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                            Suspension Reason <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 resize-none transition-all"
                            rows={3}
                            placeholder="e.g. Violation of terms of service, fraudulent reports, pending investigation..."
                            value={reason}
                            onChange={(e) => { setReason(e.target.value); setError(""); }}
                            disabled={loading}
                            autoFocus
                        />
                        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
                    </div>
                </div>

                <div className="px-6 pb-6 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="px-5 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-all text-sm"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || !reason.trim()}
                        className="px-5 py-2 rounded-xl bg-orange-600 text-white font-semibold hover:bg-orange-700 shadow-lg shadow-orange-200 transition-all text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Ban size={16} />
                        {loading ? "Suspending..." : "Confirm Suspension"}
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
