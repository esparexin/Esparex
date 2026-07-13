"use client";

import { useFormContext, useWatch } from "react-hook-form";
import { usePostAdFlow, usePostAdAction } from "../../context";
import { Field } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "@/icons/IconRegistry";
import { MAX_AD_DESCRIPTION_CHARS } from "@shared";
import { cn } from "@/components/ui/utils";
import { AdPayload as PostAdFormData } from "@/schemas/adPayload.schema";
import { getNestedFieldMeta } from "../common/utils";
import { useCallback } from "react";

function DescriptionCharCounter() {
    const description = useWatch({ name: "description" }) as string || "";
    return (
        <span className={cn(
            "text-xs font-bold tracking-tight",
            description.length >= MAX_AD_DESCRIPTION_CHARS ? "text-amber-600" : "text-foreground-subtle"
        )}>
            {description.length} / {MAX_AD_DESCRIPTION_CHARS}
        </span>
    );
}

export function DescriptionSection() {
    const { register } = useFormContext<PostAdFormData>();
    const { isLoading, form, stepValidationAttempts } = usePostAdFlow();
    const { generateDescription } = usePostAdAction();

    const { touchedFields, errors, submitCount } = form.formState;
    const hasAttemptedStepValidation = Boolean(stepValidationAttempts[2]);
    const hasAttemptedSubmit = submitCount > 0;

    const shouldShowFieldError = useCallback((path: string) => {
        if (hasAttemptedSubmit || hasAttemptedStepValidation) return true;
        return Boolean(getNestedFieldMeta(touchedFields, path));
    }, [hasAttemptedStepValidation, hasAttemptedSubmit, touchedFields]);

    const descriptionError = shouldShowFieldError("description") ? errors.description?.message : undefined;

    return (
        <section className="space-y-4">
            <Field label="Describe your product" required error={descriptionError as string}>
                <div className="space-y-3">
                    <div className="relative">
                        <Textarea
                            {...register("description")}
                            placeholder="Describe the condition, issues, and what's included..."
                            maxLength={MAX_AD_DESCRIPTION_CHARS}
                            className="min-h-[200px] rounded-2xl border-2 border-slate-100 focus:border-primary font-medium text-base py-4"
                        />
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => generateDescription('description')}
                            disabled={isLoading}
                            className="absolute bottom-3 right-3 h-11 px-3 text-xs bg-primary/10 text-primary hover:bg-primary/20 rounded-lg font-semibold"
                        >
                            {isLoading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : "AI Enhance"}
                        </Button>
                    </div>
                    <div className="flex justify-end">
                        <DescriptionCharCounter />
                    </div>
                </div>
            </Field>
        </section>
    );
}
