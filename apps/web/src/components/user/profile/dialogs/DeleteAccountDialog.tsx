
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@esparex/ui";
import { FormError } from "@esparex/ui";
import { Input } from "@esparex/ui";
import { Label } from "@esparex/ui";
import { Textarea } from "@esparex/ui";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@esparex/ui";
import { AlertTriangle, Loader2 } from "@esparex/ui";
import { cn } from "@/lib/utils";
import type { DeleteAccountFieldErrors, DeleteAccountReason } from "../types";
import { DELETE_ACCOUNT_REASONS } from "../types";

const DELETE_REASON_LABELS: Record<DeleteAccountReason, string> = {
    not_useful: "Not useful for me",
    privacy_concerns: "Privacy concerns",
    too_many_emails: "Too many notifications",
    found_alternative: "Found an alternative",
    other: "Other",
};

interface DeleteAccountDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    deleteConfirmText: string;
    setDeleteConfirmText: (text: string) => void;
    deleteReason: DeleteAccountReason;
    setDeleteReason: (reason: DeleteAccountReason) => void;
    deleteFeedback: string;
    setDeleteFeedback: (feedback: string) => void;
    onDelete: () => void;
    isDeleting?: boolean;
    deleteAccountErrors?: DeleteAccountFieldErrors;
    deleteAccountGlobalError?: string | null;
}

export function DeleteAccountDialog({
    open,
    onOpenChange,
    deleteConfirmText,
    setDeleteConfirmText,
    deleteReason,
    setDeleteReason,
    deleteFeedback,
    setDeleteFeedback,
    onDelete,
    isDeleting = false,
    deleteAccountErrors,
    deleteAccountGlobalError,
}: DeleteAccountDialogProps) {
    // Controls are locked while the API call is in flight
    const isLocked = isDeleting;

    return (
        <Dialog open={open} onOpenChange={isLocked ? undefined : onOpenChange}>
            <DialogContent padding="none" className="max-w-[calc(100vw-2rem)] sm:max-w-[420px] overflow-hidden rounded-2xl shadow-xl">
                {/* Header */}
                <DialogHeader className="mb-0 shrink-0 border-b border-border/60 bg-card px-4 py-3 sm:px-5 sm:py-3.5 pr-11">
                    <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
                            <AlertTriangle className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                            <DialogTitle>
                                Delete Account
                            </DialogTitle>
                            <DialogDescription>
                                Permanent action • Data cannot be recovered
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                {/* Form Body */}
                <div className="max-h-[min(65vh,500px)] overflow-y-auto px-4 py-3.5 sm:px-5 sm:py-4 space-y-3">
                    {/* Compact Notice */}
                    <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2 text-tiny text-destructive/90 flex items-start gap-2">
                        <span className="font-bold text-destructive shrink-0">Notice:</span>
                        <span>Removes access to your active listings, chats, and saved activity permanently.</span>
                    </div>

                    {/* Reason Dropdown */}
                    <div className="space-y-1">
                        <Label htmlFor="delete-account-reason" className="text-body font-semibold text-foreground-secondary">
                            Reason for leaving
                        </Label>
                        <Select
                            value={deleteReason}
                            onValueChange={(value) => setDeleteReason(value as DeleteAccountReason)}
                            disabled={isLocked}
                        >
                            <SelectTrigger
                                id="delete-account-reason"
                                aria-invalid={!!deleteAccountErrors?.reason}
                                className="h-11 rounded-xl text-body-lg md:text-body font-normal border-border bg-card shadow-2xs"
                            >
                                <SelectValue placeholder="Select a reason" />
                            </SelectTrigger>
                            <SelectContent>
                                {DELETE_ACCOUNT_REASONS.map((reason) => (
                                    <SelectItem key={reason} value={reason}>
                                        {DELETE_REASON_LABELS[reason]}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormError message={deleteAccountErrors?.reason} />
                    </div>

                    {/* Optional Feedback */}
                    <div className="space-y-1">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="delete-account-feedback" className="text-body font-semibold text-foreground-secondary">
                                Feedback <span className="font-normal text-muted-foreground">(optional)</span>
                            </Label>
                            <span className={cn("text-tiny tabular-nums", deleteFeedback.length >= 500 ? "text-destructive font-bold" : "text-muted-foreground")}>
                                {deleteFeedback.length}/500
                            </span>
                        </div>
                        <Textarea
                            id="delete-account-feedback"
                            value={deleteFeedback}
                            onChange={(e) => setDeleteFeedback(e.target.value.slice(0, 500))}
                            placeholder="How could we have improved?"
                            maxLength={500}
                            disabled={isLocked}
                            rows={2}
                            className="min-h-[72px] rounded-xl text-body-lg md:text-body font-normal border-border bg-card shadow-2xs resize-none p-2.5 leading-snug focus-visible:ring-1 focus-visible:ring-primary/20 focus-visible:border-primary"
                            aria-invalid={!!deleteAccountErrors?.feedback}
                        />
                        <FormError message={deleteAccountErrors?.feedback} />
                    </div>

                    {/* Confirmation input */}
                    <div className="space-y-1">
                        <Label htmlFor="delete-account-confirm" className="text-body font-semibold text-foreground-secondary">
                            Type <span className="font-bold text-destructive">delete</span> to confirm
                        </Label>
                        <Input
                            id="delete-account-confirm"
                            placeholder="Type 'delete' to confirm"
                            value={deleteConfirmText}
                            onChange={(e) => setDeleteConfirmText(e.target.value)}
                            disabled={isLocked}
                            className="h-11 rounded-xl text-body-lg md:text-body font-normal border-border bg-card shadow-2xs focus-visible:ring-1 focus-visible:ring-primary/20 focus-visible:border-primary"
                            aria-invalid={!!deleteAccountErrors?.confirmText}
                            aria-describedby={deleteAccountErrors?.confirmText ? "delete-confirm-error" : undefined}
                        />
                        <FormError id="delete-confirm-error" message={deleteAccountErrors?.confirmText} />
                    </div>

                    <FormError message={deleteAccountGlobalError} />
                </div>

                {/* Footer */}
                <DialogFooter className="mt-0 shrink-0 border-t border-border/50 bg-muted/20 px-4 py-2.5 sm:px-5 sm:py-3 flex flex-row items-center justify-end gap-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isLocked}
                        size="sm"
                        className="h-9 px-3.5 rounded-xl border-border font-semibold text-caption hover:bg-muted"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={onDelete}
                        disabled={isLocked}
                        aria-busy={isDeleting}
                        size="sm"
                        className="h-9 px-3.5 rounded-xl font-semibold text-caption shadow-xs"
                    >
                        {isDeleting ? (
                            <>
                                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                                Deleting...
                            </>
                        ) : (
                            "Delete Account"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
