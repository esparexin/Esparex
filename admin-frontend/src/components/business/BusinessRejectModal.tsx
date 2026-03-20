"use client";

import { useState } from "react";
import { XCircle, AlertTriangle } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";

interface BusinessRejectModalProps {
    businessName: string;
    onClose: () => void;
    onConfirm: (reason: string) => Promise<void>;
}

export function BusinessRejectModal({ businessName, onClose, onConfirm }: BusinessRejectModalProps) {
    const [reason, setReason] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async () => {
        const trimmed = reason.trim();
        if (!trimmed) {
            setError("Rejection reason is required.");
            return;
        }
        if (trimmed.length < 10) {
            setError("Please provide a more descriptive reason (min 10 characters).");
            return;
        }
        setLoading(true);
        setError("");
        try {
            await onConfirm(trimmed);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to reject business");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent className="max-w-md rounded-2xl p-0 overflow-hidden">
                <DialogHeader className="p-6 border-b border-slate-100 bg-red-50/60">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
                            <XCircle size={20} />
                        </div>
                        <div>
                            <DialogTitle className="text-base font-bold text-slate-900">Reject Business Application</DialogTitle>
                            <DialogDescription className="text-xs text-slate-500 mt-0.5">
                                This action will reject <span className="font-semibold text-slate-700">{businessName}</span> and notify the owner.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-6 space-y-4">
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
                        <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                        All associated listings will be expired upon rejection.
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                            Rejection Reason <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400 resize-none transition-all"
                            rows={4}
                            placeholder="e.g. Incomplete documentation, duplicate registration, invalid GST number..."
                            value={reason}
                            onChange={(e) => { setReason(e.target.value); setError(""); }}
                            disabled={loading}
                            autoFocus
                        />
                        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
                        <p className="text-[10px] text-slate-400 mt-1">{reason.trim().length} / min 10 characters</p>
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
                        className="px-5 py-2 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 shadow-lg shadow-red-200 transition-all text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <XCircle size={16} />
                        {loading ? "Rejecting..." : "Confirm Rejection"}
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
