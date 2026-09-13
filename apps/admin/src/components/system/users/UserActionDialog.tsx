"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@esparex/ui";
import { useEffect, useState, type ReactNode } from "react";
import type { LucideIcon } from "@esparex/ui";
import { Ban, CheckCircle2, PlayCircle, Shield } from "@esparex/ui";

import {
    getUserDisplayName,
    type ManagedUser,
    type UserActionType,
} from "@/components/system/users/userManagement";

interface UserActionDialogProps {
    open: boolean;
    user: ManagedUser | null;
    actionType: UserActionType;
    isSubmitting: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => Promise<void> | void;
}

type ActionPresentation = {
    title: string;
    description: string;
    helper: ReactNode;
    confirmLabel: string;
    submittingLabel: string;
    icon: LucideIcon;
    headerClassName: string;
    actionClassName: string;
    requiresReason: boolean;
};

const ACTION_PRESENTATION: Record<UserActionType, ActionPresentation> = {
    suspend: {
        title: "Suspend User",
        description: "You are about to suspend",
        helper: "Provide a clear reason so support and audit logs can explain the restriction.",
        confirmLabel: "Confirm Suspension",
        submittingLabel: "Suspending...",
        icon: Shield,
        headerClassName: "border-amber-100 bg-amber-50 text-amber-900",
        actionClassName: "bg-amber-600 hover:bg-amber-700",
        requiresReason: true,
    },
    ban: {
        title: "Block User",
        description: "You are about to block",
        helper: "Provide a clear reason so support and audit logs can explain the restriction.",
        confirmLabel: "Confirm Block",
        submittingLabel: "Blocking...",
        icon: Ban,
        headerClassName: "border-red-100 bg-red-50 text-red-900",
        actionClassName: "bg-red-600 hover:bg-red-700",
        requiresReason: true,
    },
    activate: {
        title: "Reactivate Account",
        description: "You are about to reactivate",
        helper: "This will restore account access and clear the user back to an active lifecycle state.",
        confirmLabel: "Reactivate Account",
        submittingLabel: "Reactivating...",
        icon: PlayCircle,
        headerClassName: "border-emerald-100 bg-emerald-50 text-emerald-900",
        actionClassName: "bg-emerald-600 hover:bg-emerald-700",
        requiresReason: false,
    },
    verify: {
        title: "Verify User",
        description: "You are about to verify",
        helper: "This marks the account as trusted at the admin level.",
        confirmLabel: "Verify User",
        submittingLabel: "Verifying...",
        icon: CheckCircle2,
        headerClassName: "border-emerald-100 bg-emerald-50 text-emerald-900",
        actionClassName: "bg-emerald-600 hover:bg-emerald-700",
        requiresReason: false,
    },
    unverify: {
        title: "Revoke Verification",
        description: "You are about to remove verification from",
        helper: "This will remove the account's verified flag without changing its active/suspended state.",
        confirmLabel: "Revoke Verification",
        submittingLabel: "Updating...",
        icon: Shield,
        headerClassName: "border-border bg-muted/40 text-foreground",
        actionClassName: "bg-foreground hover:bg-foreground/90 text-background",
        requiresReason: false,
    },
};

export function UserActionDialog({
    open,
    user,
    actionType,
    isSubmitting,
    onClose,
    onConfirm,
}: UserActionDialogProps) {
    const [reason, setReason] = useState("");

    useEffect(() => {
        if (open) {
            void (async () => { setReason(""); })();
        }
    }, [open, actionType, user?.id]);

    if (!user) {
        return null;
    }

    const presentation = ACTION_PRESENTATION[actionType];
    const Icon = presentation.icon;
    const canSubmit = !presentation.requiresReason || Boolean(reason.trim());

    return (
        <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen && !isSubmitting) onClose(); }}>
            <DialogContent className="max-w-md overflow-hidden rounded-2xl p-0">
                <DialogHeader className={`border-b p-6 ${presentation.headerClassName}`}>
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/60">
                            <Icon size={20} />
                        </div>
                        <div>
                            <DialogTitle className="text-base font-bold text-foreground">
                                {presentation.title}
                            </DialogTitle>
                            <DialogDescription className="mt-0.5 text-xs text-foreground-secondary">
                                {presentation.description}{" "}
                                <span className="font-semibold text-foreground">
                                    {getUserDisplayName(user)}
                                </span>.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-4 p-6">
                    <div className="rounded-lg border border-border bg-muted/30 p-3 text-caption text-foreground-secondary">
                        {presentation.helper}
                    </div>

                    {presentation.requiresReason ? (
                        <div>
                            <label className="mb-2 block text-body font-semibold text-foreground-secondary">
                                Reason for Action <span className="text-destructive">*</span>
                            </label>
                            <textarea
                                className="min-h-[100px] w-full rounded-lg border border-input bg-background p-3 text-body text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                                placeholder="Explain why this account is being actioned to maintain the audit log..."
                                value={reason}
                                onChange={(event) => setReason(event.target.value)}
                                disabled={isSubmitting}
                            />
                        </div>
                    ) : null}

                    <p className="text-body text-foreground-tertiary">
                        Are you sure you wish to proceed? This will be logged permanently in the
                        system audit trail.
                    </p>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 rounded-lg bg-muted px-4 py-2 font-bold text-foreground-secondary transition-colors hover:bg-muted/80 cursor-pointer"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => void onConfirm(reason.trim())}
                            disabled={isSubmitting || !canSubmit}
                            className={`flex-1 rounded-lg px-4 py-2 font-bold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer ${presentation.actionClassName}`}
                        >
                            {isSubmitting ? presentation.submittingLabel : presentation.confirmLabel}
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
