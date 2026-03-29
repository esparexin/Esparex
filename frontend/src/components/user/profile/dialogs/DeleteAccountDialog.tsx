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
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="h-5 w-5" />
                        Delete Account
                    </DialogTitle>
                    <DialogDescription>
                        This action cannot be undone. All your data will be permanently deleted.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
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
                    <div className="space-y-2">
                        <Label htmlFor="delete-account-feedback">Optional feedback</Label>
                        <Textarea
                            id="delete-account-feedback"
                            value={deleteFeedback}
                            onChange={(e) => setDeleteFeedback(e.target.value)}
                            placeholder="Tell us what went wrong or what we could improve"
                            rows={4}
                            aria-invalid={!!deleteAccountErrors?.feedback}
                        />
                        <FormError message={deleteAccountErrors?.feedback} />
                    </div>
                    <p className="text-sm">
                        Type <span className="font-bold">delete</span> to confirm:
                    </p>
                    <Input
                        placeholder="Type 'delete' to confirm"
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        aria-invalid={!!deleteAccountErrors?.confirmText}
                    />
                    <FormError message={deleteAccountErrors?.confirmText} />
                    <FormError message={deleteAccountGlobalError} />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={onDelete}
                        disabled={deleteConfirmText.trim().toLowerCase() !== "delete"}
                    >
                        Delete Account
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
