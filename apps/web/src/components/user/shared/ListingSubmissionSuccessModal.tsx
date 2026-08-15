"use client";

import { Button, Dialog, DialogContent, DialogDescription, DialogTitle, Stack } from "@esparex/ui";

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
                className="w-[calc(100%-2rem)] max-w-[320px] sm:max-w-sm rounded-2xl bg-white p-4 sm:p-5 text-center shadow-xl border-none"
            >
                <Stack gap="md">
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 ring-4 ring-emerald-50">
                        <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>

                    <Stack gap="xs">
                        <DialogTitle className="text-body-lg sm:text-h4 font-bold text-foreground">
                            {titleText}
                        </DialogTitle>
                        <DialogDescription id="submission-success-description" className="text-caption sm:text-body text-foreground-secondary leading-relaxed">
                            Your {entityLabel.toLowerCase()} is pending admin review.<br />
                            It will go live after approval.
                        </DialogDescription>
                        <p className="text-tiny text-muted-foreground">Usually reviewed within 24 hours.</p>
                    </Stack>

                    <div className="flex flex-col gap-2 pt-1">
                        <Button
                            onClick={onPrimaryAction}
                            className="w-full h-9 sm:h-10 bg-blue-600 text-white hover:bg-blue-700 font-semibold text-caption sm:text-body rounded-xl shadow-xs"
                        >
                            Done
                        </Button>
                        <Button
                            variant="outline"
                            onClick={onSecondaryAction}
                            className="w-full h-9 sm:h-10 border-slate-200 text-foreground-secondary hover:bg-muted font-medium text-caption sm:text-body rounded-xl"
                        >
                            {pendingActionLabel}
                        </Button>
                    </div>
                </Stack>
            </DialogContent>
        </Dialog>
    );
}
