"use client";

import { useFormContext } from "react-hook-form";
import { usePostAdFlow, usePostAdAction } from "../../context";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@esparex/ui";
import { Loader2 } from "@/icons/IconRegistry";
import { MAX_AD_TITLE_CHARS } from "@esparex/contracts";
import { AdPayload as PostAdFormData } from "@/schemas/adPayload.schema";
import { useStepFieldError, CharCounter } from "../common/Utils";

export function TitleSection() {
    const { register } = useFormContext<PostAdFormData>();
    const { isGeneratingAI, isAiAvailable } = usePostAdFlow();
    const { generateDescription } = usePostAdAction();

    const getFieldError = useStepFieldError(2);
    const titleError = getFieldError("title");

    return (
        <section className="space-y-3" aria-labelledby="title-heading">
            <h2 id="title-heading" className="sr-only">Title</h2>
            <Field error={titleError as string}>
                <div className="flex items-center justify-between gap-2 mb-1">
                    <label htmlFor="title" className="text-sm font-medium leading-snug text-foreground-secondary">
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
                    className="h-11 text-sm font-medium border-slate-200 rounded-xl shadow-2xs focus-visible:ring-2 focus-visible:ring-blue-600/20 focus-visible:border-blue-600"
                />
                <div className="flex justify-between items-center mt-1">
                    <CharCounter name="title" max={MAX_AD_TITLE_CHARS} />
                </div>
            </Field>
        </section>
    );
}
