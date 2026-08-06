"use client";

import { usePostAdCatalog, usePostAdAction } from "../../context";
import { Button, FieldRoot, FieldLabel, FieldControl, FormItem } from "@esparex/ui";
import { cn } from "@/components/ui/utils";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { Leaf, Contrast, Zap } from "@/icons/IconRegistry";

export function DeviceConditionSection() {
    const { availableSpareParts, isLoadingSpareParts, sparePartsError } = usePostAdCatalog();
    const { watch, toggleSparePart, loadSparePartsForCategory } = usePostAdAction();

    const categoryId = String(watch("categoryId") || watch("category") || "");
    const spareParts = (watch("spareParts") || []) as string[];
    const deviceCondition = watch("deviceCondition");
    const hasSelection = deviceCondition === "power_on" || deviceCondition === "power_off";

    return (
        <div className="space-y-4">
            {categoryId && (
                <section className="space-y-2">
                    <label className="text-sm font-semibold text-foreground-secondary leading-snug block mb-1.5">Working Spare Parts</label>
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

            <section aria-labelledby="condition-heading" className="pt-2">
                <h2 id="condition-heading" className="sr-only">Device Condition</h2>
                <FieldRoot<any>
                    name="deviceCondition"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center gap-x-4 gap-y-0 space-y-0">
                            <FieldLabel className="text-sm font-semibold m-0 leading-none">Device Condition</FieldLabel>
                            <FieldControl animateOnError>
                                <RadioGroupPrimitive.Root
                                    onValueChange={field.onChange}
                                    value={field.value || ""}
                                    className="flex"
                                    orientation="horizontal"
                                >
                                    <div className="w-fit inline-flex items-center p-1 rounded-full border-2 border-slate-200/80 bg-white shadow-2xs">
                                        <RadioGroupPrimitive.Item 
                                            value="power_off"
                                            title="Power Off"
                                            aria-label="Power Off"
                                            className={cn(
                                                "group flex items-center justify-center gap-1.5 px-3 h-8 rounded-full transition-all duration-200 cursor-pointer select-none", 
                                                "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1",
                                                "data-[state=checked]:bg-slate-100/80 data-[state=checked]:shadow-inner"
                                            )}
                                        >
                                            <Leaf 
                                                className={cn(
                                                    "w-4 h-4 transition-all duration-200 text-slate-500", 
                                                    "group-data-[state=checked]:scale-110 group-data-[state=checked]:text-slate-700"
                                                )} 
                                                strokeWidth={2.5}
                                            />
                                            <span className="text-xs font-medium text-slate-500 group-data-[state=checked]:text-slate-900 group-data-[state=checked]:font-semibold transition-colors duration-200">
                                                Power Off
                                            </span>
                                        </RadioGroupPrimitive.Item>

                                        {!hasSelection && (
                                            <div className="flex items-center justify-center px-1 h-8 rounded-full pointer-events-none">
                                                <Contrast className="w-4 h-4 text-blue-500" strokeWidth={2.5} />
                                            </div>
                                        )}

                                        <RadioGroupPrimitive.Item 
                                            value="power_on"
                                            title="Power On"
                                            aria-label="Power On"
                                            className={cn(
                                                "group flex items-center justify-center gap-1.5 px-3 h-8 rounded-full transition-all duration-200 cursor-pointer select-none", 
                                                "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1",
                                                "data-[state=checked]:bg-slate-100/80 data-[state=checked]:shadow-inner"
                                            )}
                                        >
                                            <Zap 
                                                className={cn(
                                                    "w-4 h-4 transition-all duration-200 text-rose-700/70", 
                                                    "group-data-[state=checked]:scale-110 group-data-[state=checked]:text-rose-700"
                                                )} 
                                                strokeWidth={2.5}
                                            />
                                            <span className="text-xs font-medium text-slate-500 group-data-[state=checked]:text-rose-900 group-data-[state=checked]:font-semibold transition-colors duration-200">
                                                Power On
                                            </span>
                                        </RadioGroupPrimitive.Item>
                                    </div>
                                </RadioGroupPrimitive.Root>
                            </FieldControl>
                        </FormItem>
                    )}
                />
            </section>
        </div>
    );
}
