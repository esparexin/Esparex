"use client";

import { usePostAdFlow, usePostAdAction } from "../../context";
import { Input, Button, FieldRoot, FieldLabel, FieldControl, FieldMessage } from "@esparex/ui";
import { Loader2 } from "@/icons/IconRegistry";
import { MAX_AD_TITLE_CHARS } from "@esparex/contracts";
import { AdPayload as PostAdFormData } from "@/schemas/adPayload.schema";
import { CharCounter } from "../common/Utils";

export function TitleSection() {
    const { isGeneratingAI, isAiAvailable } = usePostAdFlow();
    const { generateDescription } = usePostAdAction();

    return (
        <section className="space-y-3" aria-labelledby="title-heading">
            <h2 id="title-heading" className="sr-only">Title</h2>
            <FieldRoot<PostAdFormData, "title">
                name="title"
                render={({ field }) => (
                    <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between gap-2 mb-1">
                            <FieldLabel required className="text-xs sm:text-sm font-semibold leading-snug text-foreground-secondary">
                                Choose a catchy title
                            </FieldLabel>
                            {isAiAvailable && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => generateDescription('title')}
                                    disabled={isGeneratingAI !== null}
                                    className="h-7 sm:h-8 px-2.5 sm:px-3 text-xs bg-primary/10 text-primary hover:bg-primary/20 rounded-lg font-medium shrink-0"
                                >
                                    {isGeneratingAI === 'title' ? <Loader2 className="w-3 h-3 animate-spin" /> : "AI Suggest"}
                                </Button>
                            )}
                        </div>
                        <FieldControl animateOnError>
                            <Input
                                {...field}
                                placeholder="e.g. iPhone 13 Pro - Screen issue"
                                maxLength={MAX_AD_TITLE_CHARS}
                                className="h-11 text-sm font-normal sm:font-medium border-slate-200 rounded-xl shadow-2xs focus-visible:ring-2 focus-visible:ring-blue-600/20 focus-visible:border-blue-600 placeholder:text-xs sm:placeholder:text-sm"
                            />
                        </FieldControl>
                        <div className="flex justify-between items-start mt-1">
                            <FieldMessage />
                            <CharCounter name="title" max={MAX_AD_TITLE_CHARS} />
                        </div>
                    </div>
                )}
            />
        </section>
    );
}
