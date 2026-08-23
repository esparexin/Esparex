"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@esparex/ui";
import { useMemo, useState } from "react";


const REJECTION_REASONS = [
    "Spam",
    "Fraud",
    "Wrong Category",
    "Prohibited Item",
    "Duplicate Listing",
    "Other"
] as const;

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
    const [reason, setReason] = useState<(typeof REJECTION_REASONS)[number]>("Spam");
    const [comment, setComment] = useState("");

    const finalReason = useMemo(() => {
        const normalizedComment = comment.trim();
        if (!normalizedComment) return reason;
        return `${reason}: ${normalizedComment}`;
    }, [comment, reason]);

    return (
        <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
            <DialogContent className="w-[calc(100%-2rem)] max-w-lg p-0">
                <DialogHeader className="border-b border-slate-100 px-6 py-4">
                    <DialogTitle>{`Reject ${entityLabel.charAt(0).toUpperCase()}${entityLabel.slice(1)}`}</DialogTitle>
                    <DialogDescription className="text-xs text-foreground-tertiary">
                        {title ? `${entityLabel}: ${title}` : `${affectedCount} selected ${entityLabel}(s)`}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 px-6 py-5">
                    <div className="space-y-1.5">
                        <label htmlFor="rejection-reason-select" className="block text-sm font-medium text-foreground-secondary">
                            Rejection reason
                        </label>
                        <select
                            id="rejection-reason-select"
                            value={reason}
                            onChange={(event) => setReason(event.target.value as (typeof REJECTION_REASONS)[number])}
                            aria-label="Rejection reason"
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                        >
                            {REJECTION_REASONS.map((item) => (
                                <option key={item} value={item}>
                                    {item}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label htmlFor="rejection-comment-textarea" className="block text-sm font-medium text-foreground-secondary">
                            Comment (optional)
                        </label>
                        <textarea
                            id="rejection-comment-textarea"
                            value={comment}
                            onChange={(event) => setComment(event.target.value)}
                            placeholder="Provide context for moderation history"
                            aria-label="Rejection comment"
                            className="h-28 w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                        />
                    </div>
                </div>

                <DialogFooter className="border-t border-slate-100 bg-slate-50 px-6 py-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-foreground-secondary hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={() => void onSubmit(finalReason)}
                        disabled={isSubmitting}
                        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600/40"
                    >
                        {isSubmitting ? "Rejecting..." : "Reject"}
                    </button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
