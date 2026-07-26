"use client";

import { useFormContext, useWatch } from "react-hook-form";
import { usePostAdFlow, usePostAdAction } from "../../context";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@esparex/ui";
import { Loader2 } from "@/icons/IconRegistry";
import { MAX_AD_TITLE_CHARS } from "@esparex/contracts";
import { cn } from "@/components/ui/utils";
import { AdPayload as PostAdFormData } from "@/schemas/adPayload.schema";
import { getNestedFieldMeta } from "../common/utils";
import { useCallback } from "react";

function TitleCharCounter() {
    const title = useWatch({ name: "title" }) as string || "";
    return (
        <span className={cn(
            "text-xs font-normal tracking-tight",
            title.length >= MAX_AD_TITLE_CHARS ? "text-amber-600" : "text-foreground-subtle"
        )}>
            {title.length} / {MAX_AD_TITLE_CHARS}
        </span>
    );
}

export function TitleSection() {
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

    const titleError = shouldShowFieldError("title") ? errors.title?.message : undefined;

    return (
        <section className="space-y-3" aria-labelledby="title-heading">
            <h2 id="title-heading" className="sr-only">Title</h2>
            <Field error={titleError as string}>
                <div className="flex items-center justify-between gap-2 mb-1">
                    <label htmlFor="title" className="text-base font-medium leading-snug text-foreground-secondary">
                        Choose a catchy title<span className="text-destructive ml-1">*</span>
                    </label>
                    {isAiAvailable && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => generateDescription('title')}
                            disabled={isGeneratingAI !== null}
                            className="h-8 px-3 text-xs bg-primary/10 text-primary hover:bg-primary/20 rounded-lg font-medium shrink-0"
                        >
                            {isGeneratingAI === 'title' ? <Loader2 className="w-3 h-3 animate-spin" /> : "AI Suggest"}
                        </Button>
                    )}
                </div>
                <Input
                    {...register("title")}
                    placeholder="e.g. iPhone 13 Pro - Screen issue"
                    maxLength={MAX_AD_TITLE_CHARS}
                    className="h-12 rounded-xl border-2 border-slate-100 focus:border-primary font-normal text-base"
                />
                <div className="flex justify-between items-center mt-1">
                    <TitleCharCounter />
                </div>
            </Field>
        </section>
    );
}
