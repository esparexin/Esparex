import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/FormError";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { AlertTriangle } from "@/components/ui/icons";
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
    deleteAccountErrors,
    deleteAccountGlobalError,
}: DeleteAccountDialogProps) {
    const confirmReady = deleteConfirmText.trim().toLowerCase() === "delete";

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent mobileSafe className="sm:max-w-lg !p-0 overflow-hidden">
                <DialogHeader className="!mb-0 shrink-0 border-b bg-white px-5 py-4 pr-12">
                    <DialogTitle className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="h-5 w-5" />
                        Delete Account
                    </DialogTitle>
                    <DialogDescription>
                        This action cannot be undone. All your data will be permanently deleted.
                    </DialogDescription>
                </DialogHeader>
                <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
                    <div className="space-y-4">
                        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                            Deleting your account removes access to your listings, chats, and saved activity. This cannot be undone.
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="delete-account-reason">Reason</Label>
                            <Select value={deleteReason} onValueChange={(value) => setDeleteReason(value as DeleteAccountReason)}>
                                <SelectTrigger
                                    id="delete-account-reason"
                                    aria-invalid={!!deleteAccountErrors?.reason}
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
                                <Label htmlFor="delete-account-feedback">Optional feedback</Label>
                                <span className={`text-xs font-medium ${deleteFeedback.length >= 500 ? "text-amber-600" : "text-muted-foreground"}`}>
                                    {deleteFeedback.length}/500
                                </span>
                            </div>
                            <Textarea
                                id="delete-account-feedback"
                                value={deleteFeedback}
                                onChange={(e) => setDeleteFeedback(e.target.value.slice(0, 500))}
                                placeholder="Tell us what went wrong or what we could improve"
                                rows={4}
                                maxLength={500}
                                aria-invalid={!!deleteAccountErrors?.feedback}
                            />
                            <FormError message={deleteAccountErrors?.feedback} />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="delete-account-confirm">
                                Type <span className="font-bold">delete</span> to confirm
                            </Label>
                            <Input
                                id="delete-account-confirm"
                                placeholder="Type 'delete' to confirm"
                                value={deleteConfirmText}
                                onChange={(e) => setDeleteConfirmText(e.target.value)}
                                aria-invalid={!!deleteAccountErrors?.confirmText}
                            />
                            <FormError message={deleteAccountErrors?.confirmText} />
                        </div>

                        <FormError message={deleteAccountGlobalError} />
                    </div>
                </div>
                <DialogFooter className="!mt-0 shrink-0 gap-2 border-t bg-white px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:justify-end">
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={onDelete}
                        disabled={!confirmReady}
                        className="w-full sm:w-auto"
                    >
                        Delete Account
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
