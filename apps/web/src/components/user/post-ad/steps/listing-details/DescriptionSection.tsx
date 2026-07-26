"use client";

import { useFormContext, useWatch } from "react-hook-form";
import { usePostAdFlow, usePostAdAction } from "../../context";
import { Field } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@esparex/ui";
import { Loader2 } from "@/icons/IconRegistry";
import { MAX_AD_DESCRIPTION_CHARS } from "@esparex/contracts";
import { cn } from "@/components/ui/utils";
import { AdPayload as PostAdFormData } from "@/schemas/adPayload.schema";
import { getNestedFieldMeta } from "../common/utils";
import { useCallback } from "react";

function DescriptionCharCounter() {
    const description = useWatch({ name: "description" }) as string || "";
    return (
        <span className={cn(
            "text-xs font-normal tracking-tight",
            description.length >= MAX_AD_DESCRIPTION_CHARS ? "text-amber-600" : "text-foreground-subtle"
        )}>
            {description.length} / {MAX_AD_DESCRIPTION_CHARS}
        </span>
    );
}

export function DescriptionSection() {
    const { register } = useFormContext<PostAdFormData>();
    const { isGeneratingAI, isAiAvailable, form, stepValidationAttempts } = usePostAdFlow();
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
        <section className="space-y-3" aria-labelledby="description-heading">
            <h2 id="description-heading" className="sr-only">Description</h2>
            <Field error={descriptionError as string}>
                <div className="flex items-center justify-between gap-2 mb-1">
                    <label htmlFor="description" className="text-base font-medium leading-snug text-foreground-secondary">
                        Describe your product<span className="text-destructive ml-1">*</span>
                    </label>
                    {isAiAvailable && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => generateDescription('description')}
                            disabled={isGeneratingAI !== null}
                            className="h-8 px-3 text-xs bg-primary/10 text-primary hover:bg-primary/20 rounded-lg font-medium shrink-0"
                        >
                            {isGeneratingAI === 'description' ? <Loader2 className="w-3 h-3 animate-spin" /> : "AI Enhance"}
                        </Button>
                    )}
                </div>
                <Textarea
                    {...register("description")}
                    placeholder="Describe the condition, issues, and what's included..."
                    maxLength={MAX_AD_DESCRIPTION_CHARS}
                    className="min-h-[160px] rounded-xl border-2 border-slate-100 focus:border-primary font-normal text-base py-3"
                />
                <div className="flex justify-end mt-1">
                    <DescriptionCharCounter />
                </div>
            </Field>
        </section>
    );
}
