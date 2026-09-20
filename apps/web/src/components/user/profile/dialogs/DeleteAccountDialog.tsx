
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
            <DialogContent mobileSafe className="sm:max-w-lg !p-0 overflow-hidden">
                <DialogHeader className="!mb-0 shrink-0 border-b bg-card px-5 py-4 pr-12">
                    <DialogTitle className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-5 w-5" />
                        Delete Account
                    </DialogTitle>
                    <DialogDescription>
                        This action cannot be undone. All your data will be permanently deleted.
                    </DialogDescription>
                </DialogHeader>
                <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
                    <div className="space-y-4">
                        <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-body text-destructive">
                            Deleting your account removes access to your listings, chats, and saved activity. This cannot be undone.
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="delete-account-reason" className="text-caption sm:text-small font-medium text-foreground-secondary">Reason</Label>
                            <Select
                                value={deleteReason}
                                onValueChange={(value) => setDeleteReason(value as DeleteAccountReason)}
                                disabled={isLocked}
                            >
                                <SelectTrigger
                                    id="delete-account-reason"
                                    aria-invalid={!!deleteAccountErrors?.reason}
                                    className="h-11 rounded-xl text-body-lg md:text-body font-normal border-border bg-card"
                                >
                                    <SelectValue placeholder="Select a reason" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="not_useful">The product is not useful for me</SelectItem>
                                    <SelectItem value="privacy_concerns">I have privacy concerns</SelectItem>
                                    <SelectItem value="too_many_emails">I get too many emails or notifications</SelectItem>
                                    <SelectItem value="found_alternative">I found an alternative</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormError message={deleteAccountErrors?.reason} />
                        </div>
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="delete-account-feedback" className="text-caption sm:text-small font-medium text-foreground-secondary">Optional feedback</Label>
                                <span className={cn("text-tiny font-normal tabular-nums", deleteFeedback.length >= 500 ? "text-destructive" : "text-foreground-subtle")}>
                                    {deleteFeedback.length}/500
                                </span>
                            </div>
                            <Textarea
                                id="delete-account-feedback"
                                value={deleteFeedback}
                                onChange={(e) => setDeleteFeedback(e.target.value.slice(0, 500))}
                                placeholder="Tell us what went wrong or what we could improve"
                                maxLength={500}
                                disabled={isLocked}
                                className="min-h-[100px] rounded-xl text-body-lg md:text-body font-normal border-border bg-card shadow-2xs resize-none p-3 leading-relaxed focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary"
                                aria-invalid={!!deleteAccountErrors?.feedback}
                            />
                            <FormError message={deleteAccountErrors?.feedback} />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="delete-account-confirm" className="text-caption sm:text-small font-medium text-foreground-secondary">
                                Type <span className="font-semibold text-foreground">delete</span> to confirm
                            </Label>
                            <Input
                                id="delete-account-confirm"
                                placeholder="Type 'delete' to confirm"
                                value={deleteConfirmText}
                                onChange={(e) => setDeleteConfirmText(e.target.value)}
                                disabled={isLocked}
                                className="h-11 rounded-xl text-body-lg md:text-body font-normal border-border bg-card shadow-2xs focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary"
                                aria-invalid={!!deleteAccountErrors?.confirmText}
                                aria-describedby={deleteAccountErrors?.confirmText ? "delete-confirm-error" : undefined}
                            />
                            <FormError id="delete-confirm-error" message={deleteAccountErrors?.confirmText} />
                        </div>

                        <FormError message={deleteAccountGlobalError} />
                    </div>
                </div>
                <DialogFooter className="!mt-0 shrink-0 gap-2 border-t bg-card px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:justify-end">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isLocked}
                        className="w-full sm:w-auto h-11 rounded-xl border-border font-semibold text-small"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={onDelete}
                        disabled={isLocked}
                        aria-busy={isDeleting}
                        className="w-full sm:w-auto h-11 rounded-xl font-semibold text-small"
                    >
                        {isDeleting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                                Deleting account...
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
