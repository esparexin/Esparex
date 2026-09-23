"use client";

import { Button, Check, Dialog, DialogContent, DialogDescription, DialogTitle, Stack } from "@esparex/ui";

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
                className="w-[calc(100%-2rem)] max-w-[320px] sm:max-w-sm rounded-2xl bg-card p-4 sm:p-5 text-center shadow-xl border-none"
            >
                <Stack gap="md">
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 ring-4 ring-emerald-50">
                        <Check className="h-5 w-5 text-emerald-600" strokeWidth={2.5} />
                    </div>

                    <Stack gap="xs">
                        <DialogTitle className="text-body-lg sm:text-h4 font-bold text-foreground">
                            {titleText}
                        </DialogTitle>
                        <DialogDescription id="submission-success-description" className="text-body text-foreground-secondary leading-relaxed">
                            Your {entityLabel.toLowerCase()} is pending admin review.<br />
                            It will go live after approval.
                        </DialogDescription>
                        <p className="text-tiny text-muted-foreground">Usually reviewed within 24 hours.</p>
                    </Stack>

                    <div className="flex flex-col gap-2 pt-1">
                        <Button
                            onClick={onPrimaryAction}
                            className="w-full h-9 sm:h-10 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-body rounded-xl shadow-xs cursor-pointer"
                        >
                            Done
                        </Button>
                        <Button
                            variant="outline"
                            onClick={onSecondaryAction}
                            className="w-full h-9 sm:h-10 border-border text-foreground-secondary hover:bg-muted font-medium text-body rounded-xl cursor-pointer"
                        >
                            {pendingActionLabel}
                        </Button>
                    </div>
                </Stack>
            </DialogContent>
        </Dialog>
    );
}
