"use client";

import { useCallback } from "react";
import { usePostAdCatalog, usePostAdAction, usePostAdFlow } from "../../context";
import { Button, FieldRoot, FieldLabel, FieldControl, FormItem } from "@esparex/ui";
import { CatalogSelectDropdown } from "@/components/user/shared/CatalogSelectDropdown";
import type { FieldValues } from "react-hook-form";
import { cn } from "@/lib/utils";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { Leaf, Contrast, Zap } from "@esparex/ui";
import { clearStep2GeneratedDetails } from "../../hooks/useCategoryDependents";

export function DeviceConditionSection() {
    const { availableSpareParts, isLoadingSpareParts, sparePartsError } = usePostAdCatalog();
    const { watch, loadSparePartsForCategory } = usePostAdAction();
    const { form } = usePostAdFlow();

    const categoryId = String(watch("categoryId") || watch("category") || "");
    const spareParts = (watch("spareParts") || []) as string[];
    const deviceCondition = watch("deviceCondition");
    const hasSelection = deviceCondition === "power_on" || deviceCondition === "power_off";

    const handleSparePartsChange = useCallback((selectedIds: string | string[]) => {
        const ids = Array.isArray(selectedIds) ? selectedIds : [selectedIds];
        form.setValue("spareParts", ids, {
            shouldValidate: true,
            shouldDirty: true,
            shouldTouch: true,
        });
        clearStep2GeneratedDetails(form);
    }, [form]);

    return (
        <div className="space-y-4">
            {categoryId && (
                <section className="space-y-2">
                    <label 
                        htmlFor="working-spare-parts-select" 
                        className="text-caption sm:text-body font-semibold text-foreground-secondary leading-snug block mb-1.5"
                    >
                        Working Spare Parts
                    </label>
                    {isLoadingSpareParts ? (
                        <div className="h-11 rounded-xl bg-muted animate-pulse border border-border" />
                    ) : sparePartsError ? (
                        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl">
                            <p className="text-caption text-destructive text-center mb-2">{sparePartsError}</p>
                            <Button 
                                type="button" 
                                variant="outline" 
                                size="sm" 
                                onClick={() => loadSparePartsForCategory(categoryId)} 
                                className="w-full text-caption font-semibold text-destructive border-destructive/30 hover:bg-destructive/10"
                            >
                                Try Again
                            </Button>
                        </div>
                    ) : availableSpareParts.length > 0 ? (
                        <CatalogSelectDropdown
                            id="working-spare-parts-select"
                            items={availableSpareParts}
                            value={spareParts}
                            onChange={handleSparePartsChange}
                            multiSelect={true}
                            placeholder="Search or select working spare parts..."
                        />
                    ) : null}
                </section>
            )}

            <section aria-labelledby="condition-heading" className="pt-2">
                <h2 id="condition-heading" className="sr-only">Device Condition</h2>
                <FieldRoot<FieldValues>
                    name="deviceCondition"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center gap-x-4 gap-y-0 space-y-0">
                            <FieldLabel className="text-caption sm:text-body font-semibold m-0 leading-none text-foreground-secondary">Device Condition</FieldLabel>
                            <FieldControl animateOnError>
                                <RadioGroupPrimitive.Root
                                    onValueChange={(val) => {
                                        if (field.value !== val) {
                                            field.onChange(val);
                                            clearStep2GeneratedDetails(form);
                                        }
                                    }}
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
