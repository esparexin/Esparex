"use client";

import { usePostAdFlow, usePostAdAction } from "../../context";
import { Textarea, Button, FieldRoot, FieldLabel, FieldControl, FieldMessage } from "@esparex/ui";
import { Loader2 } from "@/icons/IconRegistry";
import { MAX_AD_DESCRIPTION_CHARS } from "@esparex/contracts";
import { AdPayload as PostAdFormData } from "@/schemas/adPayload.schema";
import { CharCounter } from "../common/Utils";

export function DescriptionSection() {
    const { isGeneratingAI, isAiAvailable } = usePostAdFlow();
    const { generateDescription } = usePostAdAction();

    return (
        <section className="space-y-3" aria-labelledby="description-heading">
            <h2 id="description-heading" className="sr-only">Description</h2>
            <FieldRoot<PostAdFormData, "description">
                name="description"
                render={({ field }) => (
                    <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between gap-2 mb-1">
                            <FieldLabel required className="text-caption sm:text-body font-semibold leading-snug text-foreground-secondary">
                                Describe your product
                            </FieldLabel>
                            {isAiAvailable && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => generateDescription('description')}
                                    disabled={isGeneratingAI !== null}
                                    className="h-7 sm:h-8 px-2.5 sm:px-3 text-caption bg-primary/10 text-primary hover:bg-primary/20 rounded-lg font-medium shrink-0"
                                >
                                    {isGeneratingAI === 'description' ? <Loader2 className="w-3 h-3 animate-spin" /> : "AI Enhance"}
                                </Button>
                            )}
                        </div>
                        <FieldControl animateOnError>
                            <Textarea
                                {...field}
                                rows={3}
                                placeholder="Describe the condition, issues, and what's included..."
                                maxLength={MAX_AD_DESCRIPTION_CHARS}
                                className="min-h-[88px] text-body-lg md:text-body font-normal border-border rounded-xl shadow-2xs focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary py-2.5 px-3 placeholder:text-caption sm:placeholder:text-body leading-relaxed"
                            />
                        </FieldControl>
                        <div className="flex justify-between items-start mt-1">
                            <FieldMessage />
                            <CharCounter name="description" max={MAX_AD_DESCRIPTION_CHARS} />
                        </div>
                    </div>
                )}
            />
        </section>
    );
}
