"use client";

import { useFormContext, useWatch } from "react-hook-form";
import { usePostAdFlow, usePostAdAction } from "../../context";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "@/icons/IconRegistry";
import { MAX_AD_TITLE_CHARS } from "@shared";
import { cn } from "@/components/ui/utils";
import { AdPayload as PostAdFormData } from "@/schemas/adPayload.schema";
import { getNestedFieldMeta } from "../common/utils";
import { useCallback } from "react";

function TitleCharCounter() {
    const title = useWatch({ name: "title" }) as string || "";
    return (
        <span className={cn(
            "text-xs font-bold tracking-tight",
            title.length >= MAX_AD_TITLE_CHARS ? "text-amber-600" : "text-foreground-subtle"
        )}>
            {title.length} / {MAX_AD_TITLE_CHARS}
        </span>
    );
}

export function TitleSection() {
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

    const titleError = shouldShowFieldError("title") ? errors.title?.message : undefined;

    return (
        <section className="space-y-4">
            <Field label="Choose a catchy title" required error={titleError as string}>
                <div className="space-y-3">
                    <div className="relative">
                        <Input
                            {...register("title")}
                            placeholder="e.g. iPhone 13 Pro - Screen issue"
                            maxLength={MAX_AD_TITLE_CHARS}
                            className="h-14 rounded-xl border-2 border-slate-100 focus:border-primary font-bold text-base pr-20"
                        />
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => generateDescription('title')}
                            disabled={isLoading}
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-11 px-2 text-xs bg-primary/10 text-primary hover:bg-primary/20 rounded-lg font-semibold"
                        >
                            {isLoading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : "AI Suggest"}
                        </Button>
                    </div>
                    <div className="flex justify-between items-center">
                        <TitleCharCounter />
                    </div>
                </div>
            </Field>
        </section>
    );
}
