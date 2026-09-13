"use client";

import { useState } from "react";
import { Plan } from "@esparex/contracts";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
  Archive,
  AlertTriangle,
} from "@esparex/ui";

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

    if (!plan) return null;

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
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
            <DialogContent className="max-w-md p-0 overflow-hidden">
                <DialogHeader className="p-6 border-b border-border bg-muted/20">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                            <Archive size={20} aria-hidden="true" />
                        </div>
                        <div>
                            <DialogTitle className="text-body-lg font-semibold text-foreground">Archive Plan</DialogTitle>
                            <DialogDescription className="text-caption text-foreground-tertiary mt-0.5">
                                Plan: {plan.name} ({plan.code})
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-6 space-y-4">
                    <div className="flex gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900">
                        <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0" aria-hidden="true" />
                        <div className="text-caption">
                            <p className="font-semibold">This action will archive the plan.</p>
                            <p className="mt-0.5 text-amber-800">
                                Archived plans are hidden from active use but preserved in the database for
                                financial history and audit integrity. You can restore it at any time.
                            </p>
                        </div>
                    </div>

                    <div className="rounded-lg bg-muted/30 border border-border p-3 text-body">
                        <p className="text-tiny font-medium text-foreground-tertiary uppercase tracking-wider mb-1">Plan to Archive</p>
                        <p className="font-semibold text-foreground">{plan.name}</p>
                        <p className="text-caption text-foreground-tertiary font-mono mt-0.5">{plan.code}</p>
                        <div className="flex items-center gap-3 mt-2 text-caption text-foreground-secondary">
                            <span>Type: <span className="font-medium">{plan.type.replace("_", " ")}</span></span>
                            <span>Price: <span className="font-medium">{plan.price === 0 ? "Free" : `${plan.currency} ${plan.price}`}</span></span>
                        </div>
                    </div>

                    <div>
                        <label
                            htmlFor="archive-reason"
                            className="block text-body font-medium text-foreground-secondary mb-1.5"
                        >
                            Archive reason{" "}
                            <span className="text-foreground-tertiary font-normal">(optional)</span>
                        </label>
                        <textarea
                            id="archive-reason"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            disabled={isMutating}
                            rows={2}
                            maxLength={200}
                            placeholder="e.g. Promotional campaign ended, superseded by new plan..."
                            className="w-full px-3 py-2 text-body border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-60 transition-colors"
                            aria-describedby={error ? "archive-error" : undefined}
                        />
                        <p className="text-right text-tiny text-foreground-tertiary mt-0.5">{reason.length}/200</p>
                    </div>

                    {error && (
                        <div
                            id="archive-error"
                            role="alert"
                            aria-live="assertive"
                            className="flex gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-caption text-destructive"
                        >
                            <AlertTriangle size={14} className="shrink-0 mt-0.5" aria-hidden="true" />
                            {error}
                        </div>
                    )}
                </div>

                <DialogFooter className="p-4 border-t border-border bg-muted/20 flex gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleClose}
                        disabled={isMutating}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        variant="primary"
                        onClick={() => void handleConfirm()}
                        disabled={isMutating}
                    >
                        <Archive size={14} aria-hidden="true" />
                        {isMutating ? "Archiving…" : "Confirm Archive"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
