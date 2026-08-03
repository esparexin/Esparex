"use client";

import { usePostAdCatalog, usePostAdAction } from "../../context";
import { Field } from "@/components/ui/field";
import { Button } from "@esparex/ui";
import { useStepFieldError } from "../common/Utils";
import { cn } from "@/components/ui/utils";

const DEVICE_CONDITION_OPTIONS = [
    { value: "power_on", label: "Power On", dot: "bg-emerald-500", active: "bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-600/20" },
    { value: "power_off", label: "Power Off", dot: "bg-rose-500", active: "bg-rose-600 text-white border-rose-600 shadow-sm shadow-rose-600/20" },
] as const;

export function DeviceConditionSection() {
    const { availableSpareParts, isLoadingSpareParts, sparePartsError } = usePostAdCatalog();
    const { watch, setValue, toggleSparePart, loadSparePartsForCategory } = usePostAdAction();

    const categoryId = String(watch("categoryId") || watch("category") || "");
    const deviceCondition = watch("deviceCondition");
    const spareParts = (watch("spareParts") || []) as string[];

    const getFieldError = useStepFieldError(1);
    const deviceConditionError = getFieldError("deviceCondition");

    return (
        <div className="space-y-4">
            {categoryId && (
                <section className="space-y-2">
                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wider block">Working Spare Parts</label>
                    {isLoadingSpareParts ? (
                        <div className="grid grid-cols-4 gap-2">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className="h-9 rounded-xl bg-slate-100 animate-pulse" />
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
                                            "h-8 sm:h-9 px-3 rounded-xl border text-xs font-medium transition-all duration-200 cursor-pointer select-none", 
                                            selected 
                                                ? "bg-blue-600 border-blue-600 text-white font-semibold shadow-sm shadow-blue-500/20" 
                                                : "bg-slate-50/80 border-slate-200/90 text-slate-700 hover:bg-slate-100 hover:border-slate-300"
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

            <section className="space-y-2" data-field="deviceCondition" aria-labelledby="condition-heading">
                <h2 id="condition-heading" className="sr-only">Device Condition</h2>
                <Field label="Device Condition" labelClassName="text-sm font-medium" error={deviceConditionError as string}>
                    <div className="flex gap-2 flex-wrap">
                        {DEVICE_CONDITION_OPTIONS.map(({ value, label, dot, active }) => (
                            <button 
                                key={value} 
                                type="button" 
                                onClick={() => setValue("deviceCondition", value, { shouldValidate: true, shouldTouch: true })}
                                aria-pressed={deviceCondition === value}
                                className={cn(
                                    "flex items-center gap-2.5 h-10 px-4 rounded-xl border-2 text-sm font-medium transition-all duration-200 cursor-pointer select-none", 
                                    deviceCondition === value ? active : "bg-white border-slate-200/90 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                                )}
                            >
                                <div className={cn("w-2.5 h-2.5 rounded-full shrink-0", deviceCondition === value ? "bg-white" : dot)} />
                                {label}
                            </button>
                        ))}
                    </div>
                </Field>
            </section>
        </div>
    );
}
