"use client";

import { useCallback } from "react";
import { usePostAdFlow, usePostAdAction } from "../../context";
import { Field } from "@/components/ui/field";
import { getNestedFieldMeta } from "../common/utils";
import { cn } from "@/components/ui/utils";

const DEVICE_CONDITION_OPTIONS = [
    { value: "power_on", label: "Power On", dot: "bg-green-500", active: "bg-green-600 text-white border-green-600 shadow-sm" },
    { value: "power_off", label: "Power Off", dot: "bg-red-500", active: "bg-red-600 text-white border-red-600 shadow-sm" },
] as const;

export function DeviceConditionSection() {
    const { form, stepValidationAttempts } = usePostAdFlow();
    const { watch, setValue } = usePostAdAction();

    const deviceCondition = watch("deviceCondition");

    const { touchedFields } = form.formState;
    const { errors } = form.formState;
    const hasAttemptedStepValidation = Boolean(stepValidationAttempts[1]);

    const shouldShowFieldError = useCallback((path: string) => hasAttemptedStepValidation || Boolean(getNestedFieldMeta(touchedFields, path)), [hasAttemptedStepValidation, touchedFields]);
    const deviceConditionError = shouldShowFieldError("deviceCondition") ? errors.deviceCondition?.message : undefined;

    return (
        <section className="space-y-3 w-full" data-field="deviceCondition">
            <Field label="Device Condition" error={deviceConditionError as string}>
                <div className="flex gap-2 flex-wrap">
                    {DEVICE_CONDITION_OPTIONS.map(({ value, label, dot, active }) => (
                        <button 
                            key={value} 
                            type="button" 
                            onClick={() => setValue("deviceCondition", value, { shouldValidate: true, shouldTouch: true })}
                            className={cn(
                                "flex items-center gap-2 h-11 px-4 rounded-xl border-2 text-sm font-bold transition-all", 
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
    );
}
