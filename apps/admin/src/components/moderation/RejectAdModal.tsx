"use client";

import { useMemo, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import { REPORT_REASON, REPORT_REASON_VALUES } from "@esparex/shared";

const REASON_LABELS: Record<string, string> = {
    [REPORT_REASON.SPAM]: "Spam",
    [REPORT_REASON.SCAM]: "Fraud/Scam",
    [REPORT_REASON.PROHIBITED_ITEM]: "Prohibited Item",
    [REPORT_REASON.OFFENSIVE_CONTENT]: "Offensive Content",
    [REPORT_REASON.MISLEADING_INFO]: "Misleading Information",
    [REPORT_REASON.SOLD_ELSEWHERE]: "Sold Elsewhere",
    [REPORT_REASON.OTHER]: "Other",
};

type RejectAdModalProps = {
    open: boolean;
    title?: string;
    entityLabel?: string;
    affectedCount: number;
    isSubmitting?: boolean;
    onClose: () => void;
    onSubmit: (reason: string) => Promise<void> | void;
};

export function RejectAdModal({
    open,
    title,
    entityLabel = "listing",
    affectedCount,
    isSubmitting,
    onClose,
    onSubmit
}: RejectAdModalProps) {
    const [reason, setReason] = useState<string>(REPORT_REASON.SPAM);
    const [comment, setComment] = useState("");

    const finalReason = useMemo(() => {
        const normalizedComment = comment.trim();
        const label = REASON_LABELS[reason] || reason;
        if (!normalizedComment) return label;
        return `${label}: ${normalizedComment}`;
    }, [comment, reason]);

    return (
        <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
            <DialogContent className="w-[calc(100%-2rem)] max-w-lg p-0">
                <DialogHeader className="border-b border-slate-100 px-6 py-4">
                    <DialogTitle>{`Reject ${entityLabel.charAt(0).toUpperCase()}${entityLabel.slice(1)}`}</DialogTitle>
                    <DialogDescription className="text-xs text-slate-500">
                        {title ? `${entityLabel}: ${title}` : `${affectedCount} selected ${entityLabel}(s)`}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 px-6 py-5">
                    <label className="block space-y-1.5 text-sm font-medium text-slate-700">
                        <span>Rejection reason</span>
                        <select
                            value={reason}
                            onChange={(event) => setReason(event.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                        >
                            {REPORT_REASON_VALUES.map((item) => (
                                <option key={item} value={item}>
                                    {REASON_LABELS[item]}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="block space-y-1.5 text-sm font-medium text-slate-700">
                        <span>Comment (optional)</span>
                        <textarea
                            value={comment}
                            onChange={(event) => setComment(event.target.value)}
                            placeholder="Provide context for moderation history"
                            className="h-28 w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        />
                    </label>
                </div>

                <DialogFooter className="border-t border-slate-100 bg-slate-50 px-6 py-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={() => void onSubmit(finalReason)}
                        disabled={isSubmitting}
                        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isSubmitting ? "Rejecting..." : "Reject"}
                    </button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
