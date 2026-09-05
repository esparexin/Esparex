"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Button,
} from "@esparex/ui";
import { useState, type ReactNode } from "react";
import { mapErrorToMessage } from "@/lib/mapErrorToMessage";
import type { LucideIcon } from "@esparex/ui";


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
        header: "bg-destructive/10",
        iconWrap: "bg-destructive/20 text-destructive",
        notice: "bg-amber-50 border-amber-200 text-amber-800",
        field: "focus-visible:ring-2 focus-visible:ring-destructive/40 focus-visible:border-destructive",
        action: "destructive" as const,
    },
    warning: {
        header: "bg-amber-500/10",
        iconWrap: "bg-amber-500/20 text-amber-600",
        notice: "bg-amber-50 border-amber-200 text-amber-800",
        field: "focus-visible:ring-2 focus-visible:ring-amber-500/40 focus-visible:border-amber-500",
        action: "primary" as const,
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
            setError(mapErrorToMessage(err, failureMessage));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent className="max-w-md rounded-2xl p-0 overflow-hidden">
                <DialogHeader className={`p-6 border-b border-border ${styles.header}`}>
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${styles.iconWrap}`}>
                            <Icon size={20} />
                        </div>
                        <div>
                            <DialogTitle className="text-body-lg font-bold text-foreground">{title}</DialogTitle>
                            <DialogDescription className="text-caption text-foreground-tertiary mt-0.5">
                                {description}{" "}
                                <span className="font-semibold text-foreground-secondary">{businessName}</span>.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-6 space-y-4">
                    <div className={`flex items-start gap-2 p-3 rounded-lg border text-caption ${styles.notice}`}>
                        <Icon size={14} className="shrink-0 mt-0.5" />
                        {notice}
                    </div>
                    <div>
                        <label className="block text-tiny font-bold text-foreground-secondary mb-1.5 uppercase tracking-wider">
                            {label} <span className="text-destructive">*</span>
                        </label>
                        <textarea
                            className={`w-full px-3 py-2 rounded-lg border border-input bg-background text-body text-foreground placeholder:text-muted-foreground focus:outline-none resize-none transition-all ${styles.field}`}
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
                        {error && <p className="text-caption text-destructive mt-1">{error}</p>}
                        {minLength ? (
                            <p className="text-tiny text-foreground-subtle mt-1">
                                {reason.trim().length} / min {minLength} characters
                            </p>
                        ) : null}
                    </div>
                </div>

                <div className="px-6 pb-6 flex justify-end gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        variant={styles.action}
                        onClick={handleSubmit}
                        disabled={loading || !reason.trim()}
                    >
                        <Icon size={16} />
                        {loading ? submittingLabel : submitLabel}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
