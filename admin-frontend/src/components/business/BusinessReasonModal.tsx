"use client";

import { useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface BusinessReasonModalProps {
    businessName: string;
    title: string;
    description: ReactNode;
    notice: ReactNode;
    label: string;
    placeholder: string;
    requiredMessage: string;
    submitLabel: string;
    submittingLabel: string;
    failureMessage: string;
    icon: LucideIcon;
    tone: "danger" | "warning";
    rows?: number;
    minLength?: number;
    minLengthMessage?: string;
    onClose: () => void;
    onConfirm: (reason: string) => Promise<void>;
}

const toneStyles = {
    danger: {
        header: "bg-red-50/60",
        iconWrap: "bg-red-100 text-red-600",
        notice: "bg-amber-50 border-amber-200 text-amber-800",
        field: "focus:ring-2 focus:ring-red-300 focus:border-red-400",
        action: "bg-red-600 hover:bg-red-700 shadow-lg shadow-red-200",
    },
    warning: {
        header: "bg-orange-50/60",
        iconWrap: "bg-orange-100 text-orange-600",
        notice: "bg-amber-50 border-amber-200 text-amber-800",
        field: "focus:ring-2 focus:ring-orange-300 focus:border-orange-400",
        action: "bg-orange-600 hover:bg-orange-700 shadow-lg shadow-orange-200",
    },
} as const;

export function BusinessReasonModal({
    businessName,
    title,
    description,
    notice,
    label,
    placeholder,
    requiredMessage,
    submitLabel,
    submittingLabel,
    failureMessage,
    icon: Icon,
    tone,
    rows = 3,
    minLength,
    minLengthMessage,
    onClose,
    onConfirm,
}: BusinessReasonModalProps) {
    const [reason, setReason] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const styles = toneStyles[tone];

    const handleSubmit = async () => {
        const trimmed = reason.trim();
        if (!trimmed) {
            setError(requiredMessage);
            return;
        }

        if (minLength && trimmed.length < minLength) {
            setError(minLengthMessage || `Please provide at least ${minLength} characters.`);
            return;
        }

        setLoading(true);
        setError("");

        try {
            await onConfirm(trimmed);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : failureMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent className="max-w-md rounded-2xl p-0 overflow-hidden">
                <DialogHeader className={`p-6 border-b border-slate-100 ${styles.header}`}>
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${styles.iconWrap}`}>
                            <Icon size={20} />
                        </div>
                        <div>
                            <DialogTitle className="text-base font-bold text-slate-900">{title}</DialogTitle>
                            <DialogDescription className="text-xs text-slate-500 mt-0.5">
                                {description}{" "}
                                <span className="font-semibold text-slate-700">{businessName}</span>.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-6 space-y-4">
                    <div className={`flex items-start gap-2 p-3 rounded-lg border text-xs ${styles.notice}`}>
                        <Icon size={14} className="shrink-0 mt-0.5" />
                        {notice}
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                            {label} <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            className={`w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-900 focus:outline-none resize-none transition-all ${styles.field}`}
                            rows={rows}
                            placeholder={placeholder}
                            value={reason}
                            onChange={(event) => {
                                setReason(event.target.value);
                                setError("");
                            }}
                            disabled={loading}
                            autoFocus
                        />
                        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
                        {minLength ? (
                            <p className="text-[10px] text-slate-400 mt-1">
                                {reason.trim().length} / min {minLength} characters
                            </p>
                        ) : null}
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
                        className={`px-5 py-2 rounded-xl text-white font-semibold transition-all text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${styles.action}`}
                    >
                        <Icon size={16} />
                        {loading ? submittingLabel : submitLabel}
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
