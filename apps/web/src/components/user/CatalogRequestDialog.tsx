"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CatalogValidationServiceShared } from "@esparex/shared";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { createCatalogRequest } from "@/lib/api/user/catalogRequest";
import { mapErrorToMessage } from "@/lib/errorMapper";
import { Loader2 } from "@/icons/IconRegistry";
import { notify } from "@/lib/feedback";


interface CatalogRequestDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    requestType: 'brand' | 'model';
    categoryId: string;
    parentBrandId?: string;
    initialName?: string;
    /** Optional: the listing ID that triggered this suggestion (edit-ad flow only). */
    listingId?: string;
    onSuccess?: (resolvedEntityId: string, name: string, decision: 'AUTO_APPROVE' | 'MANUAL_REVIEW' | 'REJECT', created: boolean) => void;
    /** Optional custom orchestrator mutating and selecting directly (Layer 3 composed action) */
    onSubmitRequest?: (name: string) => Promise<{ status: string; id?: string; message?: string }>;
}

export function CatalogRequestDialog({
    open,
    onOpenChange,
    requestType,
    categoryId,
    parentBrandId,
    initialName = "",
    listingId,
    onSuccess,
    onSubmitRequest,
}: CatalogRequestDialogProps) {

    const [name, setName] = useState(initialName);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            if (open) {
                setName(initialName);
                setErrorMessage(null);
                return;
            }

            setName("");
            setErrorMessage(null);
        }, 0);

        return () => window.clearTimeout(timeoutId);
    }, [initialName, open]);

    const handleSubmit = async () => {
        if (!name.trim()) {
            setErrorMessage(`Enter a ${requestType === "brand" ? "brand" : "model"} name.`);
            return;
        }

        if (!categoryId) {
            setErrorMessage("Category is required.");
            return;
        }

        if (requestType === "model" && !parentBrandId) {
            setErrorMessage("Brand must be selected first.");
            return;
        }

        setIsSubmitting(true);
        setErrorMessage(null);
        if (onSubmitRequest) {
            try {
                const res = await onSubmitRequest(name.trim());
                if (res.status === 'REJECTED' || res.status === 'ERROR') {
                    setErrorMessage(res.message || "Suggestion rejected or failed.");
                    notify.error(res.message || "Suggestion rejected or failed.");
                    return;
                }
                if (res.status === 'MANUAL_REVIEW') {
                    notify.info("Your suggestion has been submitted for review.");
                }
                onOpenChange(false);
            } catch (error: unknown) {
                setErrorMessage(mapErrorToMessage(error, "Network error. Please try again."));
            } finally {
                setIsSubmitting(false);
            }
            return;
        }

        try {
            const result = await createCatalogRequest({
                requestType,
                categoryId,
                parentBrandId,
                requestedName: name.trim(),
                listingId,
            });

            if (result.decision === 'AUTO_APPROVE') {
                onSuccess?.(result.approvedEntityId || "", name.trim(), result.decision, !!result.created);
            } else {
                notify.info("Your suggestion has been submitted for review.");
                onSuccess?.(result.requestId || "", name.trim(), result.decision, false);
            }

            onOpenChange(false);
        } catch (error: unknown) {
            const data = (error as { response?: { data?: { decision?: string; message?: string } } })?.response?.data;
            if (data?.decision === 'REJECT') {
                setErrorMessage(data.message || "Please enter a valid brand or model name.");
                notify.error(data.message || "Please enter a valid brand or model name.");
            } else {
                setErrorMessage(mapErrorToMessage(error, "Network error. Please try again."));
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] rounded-2xl">
                <DialogHeader>
                    <DialogTitle>Suggest a New {requestType === 'brand' ? 'Brand' : 'Model'}</DialogTitle>
                    <DialogDescription>
                        Can&apos;t find what you&apos;re looking for? Suggest it here and we&apos;ll add it to our catalog.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    <Field label={`${requestType === 'brand' ? 'Brand' : 'Model'} Name`} required>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={`Enter ${requestType} name...`}
                            className="h-12 rounded-xl"
                            autoFocus
                        />
                    </Field>
                    {errorMessage ? (
                        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                            {errorMessage}
                        </p>
                    ) : null}
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isSubmitting}
                        className="rounded-xl"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !name.trim() || !CatalogValidationServiceShared.validateCatalogInput({ name, requestType }).ok}
                        className="rounded-xl min-w-[100px]"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Submitting
                            </>
                        ) : (
                            "Submit Request"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
