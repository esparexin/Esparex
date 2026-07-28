"use client";

import { Button, Dialog, DialogContent, DialogDescription, DialogTitle } from "@esparex/ui";

interface ListingSubmissionSuccessModalProps {
    entityLabel: string;
    isEditMode: boolean;
    pendingActionLabel: string;
    onPrimaryAction: () => void;
    onSecondaryAction: () => void;
}

export function ListingSubmissionSuccessModal({
    entityLabel,
    isEditMode,
    pendingActionLabel,
    onPrimaryAction,
    onSecondaryAction,
}: ListingSubmissionSuccessModalProps) {
    const titleText = isEditMode ? `${entityLabel} Updated` : `${entityLabel} Submitted`;

    return (
        <Dialog open={true} onOpenChange={(open) => { if (!open) onPrimaryAction(); }}>
            <DialogContent
                hideClose
                aria-describedby="submission-success-description"
                className="w-full max-w-sm space-y-6 rounded-2xl bg-white p-6 text-center shadow-2xl border-none"
            >
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                    <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                </div>

                <div className="space-y-2">
                    <DialogTitle className="text-xl font-bold text-foreground">
                        {titleText}
                    </DialogTitle>
                    <DialogDescription id="submission-success-description" className="text-sm text-foreground-tertiary">
                        Your {entityLabel.toLowerCase()} is pending admin review.<br />
                        It will go live after approval.
                    </DialogDescription>
                    <p className="mt-1 text-xs text-foreground-subtle">Usually reviewed within 24 hours.</p>
                </div>

                <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
                    <Button
                        variant="outline"
                        onClick={onSecondaryAction}
                        className="w-full sm:flex-1 h-11 border-slate-200 text-foreground-secondary hover:bg-slate-50"
                    >
                        {pendingActionLabel}
                    </Button>
                    <Button
                        onClick={onPrimaryAction}
                        className="w-full sm:flex-1 h-11 bg-blue-600 text-white hover:bg-blue-700"
                    >
                        Done
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
