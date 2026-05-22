"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
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
import { Loader2, CheckCircle2 } from "@/icons/IconRegistry";


interface CatalogRequestDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    requestType: 'brand' | 'model';
    categoryId: string;
    parentBrandId?: string;
    initialName?: string;
    onSuccess?: (requestId: string, name: string) => void;
}

export function CatalogRequestDialog({
    open,
    onOpenChange,
    requestType,
    categoryId,
    parentBrandId,
    initialName = "",
    onSuccess,
}: CatalogRequestDialogProps) {

    const [name, setName] = useState(initialName);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            if (open) {
                setName(initialName);
                setErrorMessage(null);
                setIsSuccess(false);
                return;
            }

            setName("");
            setErrorMessage(null);
            setIsSuccess(false);
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
        try {
            const result = await createCatalogRequest({
                requestType,
                categoryId,
                parentBrandId,
                requestedName: name.trim(),
            });
            
            setIsSuccess(true);
            onSuccess?.(result.id, name.trim());
            
            setTimeout(() => {
                onOpenChange(false);
            }, 2000);
        } catch (error) {
            setErrorMessage(mapErrorToMessage(error, "Network error. Please try again."));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] rounded-2xl">
                {isSuccess ? (
                    <div className="py-12 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-300">
                        <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-4" />
                        <DialogTitle className="text-xl font-bold text-slate-900 mb-2">Request Submitted!</DialogTitle>
                        <DialogDescription className="text-sm text-slate-500">
                            Request submitted for admin approval.
                        </DialogDescription>
                        <p className="mt-3 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                            Pending review
                        </p>
                    </div>
                ) : (
                    <>
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
                                disabled={isSubmitting || !name.trim()}
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
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
