"use client";

import { useCallback } from "react";
import { usePostAdCatalog, usePostAdFlow, usePostAdAction } from "../../context";
import { Field } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { getNestedFieldMeta } from "../common/utils";
import { cn } from "@/components/ui/utils";

const DEVICE_CONDITION_OPTIONS = [
    { value: "power_on", label: "Power On", dot: "bg-green-500", active: "bg-green-600 text-white border-green-600 shadow-sm" },
    { value: "power_off", label: "Power Off", dot: "bg-red-500", active: "bg-red-600 text-white border-red-600 shadow-sm" },
] as const;

export function DeviceConditionSection() {
    const { availableSpareParts, isLoadingSpareParts, sparePartsError } = usePostAdCatalog();
    const { form, stepValidationAttempts } = usePostAdFlow();
    const { watch, setValue, toggleSparePart, loadSparePartsForCategory } = usePostAdAction();

    const categoryId = String(watch("categoryId") || watch("category") || "");
    const deviceCondition = watch("deviceCondition");
    const spareParts = (watch("spareParts") || []) as string[];

    const { touchedFields } = form.formState;
    const { errors } = form.formState;
    const hasAttemptedStepValidation = Boolean(stepValidationAttempts[1]);

    const shouldShowFieldError = useCallback((path: string) => hasAttemptedStepValidation || Boolean(getNestedFieldMeta(touchedFields, path)), [hasAttemptedStepValidation, touchedFields]);
    const deviceConditionError = shouldShowFieldError("deviceCondition") ? errors.deviceCondition?.message : undefined;

    return (
        <div className="space-y-4">
            {categoryId && (
                <section className="space-y-1.5">
                    <label className="text-[10px] font-bold text-foreground-tertiary uppercase tracking-wider block ml-1">Working Spare Parts</label>
                    {isLoadingSpareParts ? (
                        <div className="grid grid-cols-4 gap-2">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className="h-6 rounded-lg bg-slate-100 animate-pulse" />
                            ))}
                        </div>
                    ) : sparePartsError ? (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                            <p className="text-xs text-red-700 text-center mb-2">{sparePartsError}</p>
                            <Button 
                                type="button" 
                                variant="outline" 
                                size="sm" 
                                onClick={() => loadSparePartsForCategory(categoryId)} 
                                className="w-full text-xs font-semibold text-red-600 border-red-200 hover:bg-red-50"
                            >
                                Try Again
                            </Button>
                        </div>
                    ) : availableSpareParts.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {availableSpareParts.map((part) => {
                                const selected = spareParts.includes(part.id as string);
                                return (
                                    <button 
                                        key={part.id as string} 
                                        type="button" 
                                        onClick={() => toggleSparePart(part.id as string)}
                                        aria-pressed={selected}
                                        className={cn(
                                            "min-h-[44px] px-3 rounded-full border-2 text-[11px] font-bold transition-all duration-200", 
                                            selected ? "bg-primary border-primary text-primary-foreground shadow-sm" : "bg-white border-slate-200 text-foreground-tertiary hover:border-slate-300"
                                        )}
                                    >
                                        {part.name}
                                    </button>
                                );
                            })}
                        </div>
                    ) : null}
                </section>
            )}

            <section className="space-y-3" data-field="deviceCondition" aria-labelledby="condition-heading">
                <h2 id="condition-heading" className="sr-only">Device Condition</h2>
                <Field label="Device Condition" error={deviceConditionError as string}>
                    <div className="flex gap-2 flex-wrap">
                        {DEVICE_CONDITION_OPTIONS.map(({ value, label, dot, active }) => (
                            <button 
                                key={value} 
                                type="button" 
                                onClick={() => setValue("deviceCondition", value, { shouldValidate: true, shouldTouch: true })}
                                aria-pressed={deviceCondition === value}
                                className={cn(
                                    "flex items-center gap-2 h-11 px-4 rounded-xl border-2 text-sm font-bold transition-all duration-200", 
                                    deviceCondition === value ? active : "bg-white border-slate-200 text-foreground-tertiary hover:border-slate-300"
                                )}
                            >
                                <div className={cn("w-2.5 h-2.5 rounded-full shrink-0", deviceCondition === value ? "bg-white/80" : dot)} />
                                {label}
                            </button>
                        ))}
                    </div>
                </Field>
            </section>
        </div>
    );
}
