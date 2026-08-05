"use client";

import { useFormContext } from "react-hook-form";
import { usePostAdFlow, usePostAdAction } from "../../context";
import { Field } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@esparex/ui";
import { Loader2 } from "@/icons/IconRegistry";
import { MAX_AD_DESCRIPTION_CHARS } from "@esparex/contracts";
import { AdPayload as PostAdFormData } from "@/schemas/adPayload.schema";
import { useStepFieldError, CharCounter } from "../common/Utils";

export function DescriptionSection() {
    const { register } = useFormContext<PostAdFormData>();
    const { isGeneratingAI, isAiAvailable } = usePostAdFlow();
    const { generateDescription } = usePostAdAction();

    const getFieldError = useStepFieldError(2);
    const descriptionError = getFieldError("description");

    return (
        <section className="space-y-3" aria-labelledby="description-heading">
            <h2 id="description-heading" className="sr-only">Description</h2>
            <Field error={descriptionError as string}>
                <div className="flex items-center justify-between gap-2 mb-1">
                    <label htmlFor="description" className="text-sm font-medium leading-snug text-foreground-secondary">
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
                    className="min-h-[140px] pb-6 text-sm font-medium border-slate-200 rounded-xl shadow-2xs focus-visible:ring-2 focus-visible:ring-blue-600/20 focus-visible:border-blue-600"
                />
                <div className="flex justify-end mt-1">
                    <CharCounter name="description" max={MAX_AD_DESCRIPTION_CHARS} />
                </div>
            </Field>
        </section>
    );
}
