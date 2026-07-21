"use client";

import { useFormContext, useWatch } from "react-hook-form";
import { usePostAdFlow } from "../../context";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/components/ui/utils";
import { AdPayload as PostAdFormData } from "@/schemas/adPayload.schema";
import { getNestedFieldMeta } from "../common/utils";
import { useCallback } from "react";

export function PriceSection() {
    const { register, setValue, trigger } = useFormContext<PostAdFormData>();
    const { form, stepValidationAttempts } = usePostAdFlow();
    
    const isFree = useWatch({ name: "isFree" });

    const { touchedFields, errors, submitCount } = form.formState;
    const hasAttemptedStepValidation = Boolean(stepValidationAttempts[2]);
    const hasAttemptedSubmit = submitCount > 0;

    const shouldShowFieldError = useCallback((path: string) => {
        if (hasAttemptedSubmit || hasAttemptedStepValidation) return true;
        return Boolean(getNestedFieldMeta(touchedFields, path));
    }, [hasAttemptedStepValidation, hasAttemptedSubmit, touchedFields]);

    const priceError = shouldShowFieldError("price") ? errors.price?.message : undefined;

    const toggleFree = useCallback(() => {
        const nextVal = !isFree;
        setValue("isFree", nextVal);
        if (nextVal) {
            setValue("price", 0, { shouldValidate: true });
        } else {
            trigger("price");
        }
    }, [isFree, setValue, trigger]);

    return (
        <section className="space-y-4" aria-labelledby="price-heading">
            <h2 id="price-heading" className="sr-only">Price</h2>
            <Field label="Set your price" required error={priceError as string}>
                <div className="flex flex-row gap-3">
                    <div className="relative flex-1 min-w-0">
                        <Input
                            {...register("price", { valueAsNumber: true })}
                            type="number"
                            placeholder="Enter amount"
                            disabled={isFree}
                            className={cn(
                                "h-12 pl-10 pr-4 rounded-xl border-2 text-base font-normal transition-all [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
                                isFree ? "bg-slate-50 border-slate-100 text-foreground-subtle" : "bg-white border-slate-200 focus:border-primary"
                            )}
                        />
                        <span className={cn(
                            "absolute left-4 top-1/2 -translate-y-1/2 font-normal text-base",
                            isFree ? "text-foreground-subtle" : "text-foreground-subtle"
                        )}>₹</span>
                    </div>

                    <button
                        type="button"
                        role="switch"
                        aria-checked={!!isFree}
                        onClick={toggleFree}
                        onKeyDown={(e) => {
                            if (e.key === " " || e.key === "Enter") {
                                e.preventDefault();
                                toggleFree();
                            }
                        }}
                        className={cn(
                            "flex items-center justify-center gap-2 h-12 px-4 rounded-xl border-2 cursor-pointer transition-all duration-200 shrink-0 sm:w-[35%] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                            isFree ? "bg-green-50 border-green-200" : "bg-white border-slate-100 hover:border-slate-200"
                        )}
                    >
                        <div className={cn(
                            "w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all",
                            isFree ? "bg-green-600 border-green-600" : "bg-white border-slate-300"
                        )}>
                            {isFree && (
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                        </div>
                        <span className={cn(
                            "text-sm font-medium whitespace-nowrap",
                            isFree ? "text-green-800" : "text-foreground-secondary"
                        )}>
                            Free
                        </span>
                    </button>
                </div>
            </Field>
        </section>
    );
}
