"use client";

import { useCallback } from "react";
import { usePostAdCatalog, usePostAdFlow, usePostAdAction } from "../../context";
import { Field } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Z_INDEX } from "@/lib/zIndexConfig";
import { useCascadeConfirmation } from "@/components/ui/cascade-confirm-dialog";
import { getNestedFieldMeta } from "../common/utils";
import { cn } from "@/components/ui/utils";

export function ScreenSizeSection() {
    const { requiresScreenSize, availableSizes } = usePostAdCatalog();
    const { isEditMode, form, stepValidationAttempts } = usePostAdFlow();
    const { watch, setValue } = usePostAdAction();
    const { withCascadeConfirmation, ConfirmDialog, dialogProps } = useCascadeConfirmation();

    const screenSize = String(watch("screenSize") || "");
    const spareParts = (watch("spareParts") || []) as string[];

    const { touchedFields } = form.formState;
    const { errors } = form.formState;
    const hasAttemptedStepValidation = Boolean(stepValidationAttempts[1]);

    const shouldShowFieldError = useCallback((path: string) => hasAttemptedStepValidation || Boolean(getNestedFieldMeta(touchedFields, path)), [hasAttemptedStepValidation, touchedFields]);
    const screenSizeError = shouldShowFieldError("screenSize") ? errors.screenSize?.message : undefined;

    const onScreenSizeChange = useCallback((val: string) => {
        const affected: string[] = [];
        if (spareParts.length > 0) affected.push("Selected Spare Parts");

        withCascadeConfirmation("Screen Size", affected, () => {
            setValue("screenSize", val, { shouldValidate: true, shouldDirty: true, shouldTouch: true }); 
            setValue("spareParts", [], { shouldValidate: true, shouldDirty: true });
        });
    }, [spareParts.length, setValue, withCascadeConfirmation]);

    if (!requiresScreenSize) {
        return null;
    }

    return (
        <div className="w-full">
            <Field label="Screen Size" error={screenSizeError as string} className={cn(isEditMode && "opacity-60 pointer-events-none")}>
                <Select value={screenSize || undefined} onValueChange={onScreenSizeChange}>
                    <SelectTrigger className="h-11 rounded-xl border-2 border-slate-200 bg-white font-bold text-foreground focus:border-primary transition-colors px-3 text-sm">
                        <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent style={{ zIndex: Z_INDEX.selectContent }} className="rounded-xl border-2 border-slate-100 shadow-xl">
                        {availableSizes.map((size) => (
                            <SelectItem key={size} value={size} className="font-medium py-2.5 px-3 text-sm">{size}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </Field>
            
            <ConfirmDialog {...dialogProps} />
        </div>
    );
}
