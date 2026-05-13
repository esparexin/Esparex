"use client";

import { useState } from "react";
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
import { Loader2, CheckCircle2 } from "@/icons/IconRegistry";
import { useAppFeedback } from "@/context/FeedbackSystemContext";

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
    const { emitError } = useAppFeedback();
    const [name, setName] = useState(initialName);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async () => {
        if (!name.trim()) {
            emitError("Please enter a name");
            return;
        }

        setIsSubmitting(true);
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
                setIsSuccess(false);
                setName("");
            }, 2000);
        } catch (error) {
            emitError(error);
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
                            Our moderators will review your {requestType} suggestion.
                        </DialogDescription>
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
