"use client";

import { useFormContext, useWatch } from "react-hook-form";
import { usePostAdFlow } from "../../context";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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

    return (
        <section className="space-y-6">
            <Field label="Set your price" required error={priceError as string}>
                <div className="space-y-4">
                    <div className="relative h-20">
                        <Input
                            {...register("price", { valueAsNumber: true })}
                            type="number"
                            placeholder="Enter Amount"
                            disabled={isFree}
                            className={cn(
                                "h-full pl-12 pr-4 rounded-2xl border-2 font-bold text-2xl transition-all",
                                isFree ? "bg-slate-50 border-slate-100 text-foreground-subtle" : "bg-white border-slate-200 focus:border-primary"
                            )}
                        />
                        <span className={cn(
                            "absolute left-5 top-1/2 -translate-y-1/2 font-bold text-2xl",
                            isFree ? "text-foreground-subtle" : "text-foreground-subtle"
                        )}>₹</span>
                    </div>

                    <div 
                        role="button"
                        tabIndex={0}
                        aria-pressed={!!isFree}
                        aria-label={isFree ? "Mark as paid" : "Mark as free"}
                        onClick={() => {
                            const nextVal = !isFree;
                            setValue("isFree", nextVal);
                            if (nextVal) {
                                setValue("price", 0, { shouldValidate: true });
                            } else {
                                trigger("price");
                            }
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                const nextVal = !isFree;
                                setValue("isFree", nextVal);
                                if (nextVal) {
                                    setValue("price", 0, { shouldValidate: true });
                                } else {
                                    trigger("price");
                                }
                            }
                        }}
                        className={cn(
                            "flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all",
                            isFree ? "bg-green-50 border-green-200 ring-2 ring-green-100" : "bg-white border-slate-100 hover:border-slate-200"
                        )}
                    >
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                                isFree ? "bg-green-600 text-white" : "bg-slate-100 text-foreground-subtle"
                            )}>
                                <Checkbox
                                    id="isFree-check"
                                    className="sr-only"
                                    checked={!!isFree}
                                    onCheckedChange={() => {}}
                                />
                                <span className="font-bold text-xs">FREE</span>
                            </div>
                            <div>
                                <p className="font-bold text-foreground text-sm">Mark as Free</p>
                                <p className="text-2xs text-muted-foreground font-medium">This item is a giveaway</p>
                            </div>
                        </div>
                        <div className={cn(
                            "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                            isFree ? "bg-green-600 border-green-600" : "bg-white border-slate-200"
                        )}>
                            {isFree && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                    </div>
                </div>
            </Field>
        </section>
    );
}
