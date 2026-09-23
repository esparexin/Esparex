"use client";

import { useCallback, useEffect } from "react";
import { usePostAdCatalog, usePostAdAction, usePostAdFlow } from "../../context";
import { Button, FieldRoot, FieldLabel, FieldControl, FormItem, FieldMessage } from "@esparex/ui";
import { CatalogSelectDropdown } from "@/components/user/shared/CatalogSelectDropdown";
import type { FieldValues } from "react-hook-form";
import { cn } from "@/lib/utils";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { Leaf, Contrast, Zap } from "@esparex/ui";
import { clearStep2GeneratedDetails } from "../../hooks/useCategoryDependents";

export function DeviceConditionSection() {
    const { availableSpareParts, isLoadingSpareParts, sparePartsError, sparePartActiveCategoryId } = usePostAdCatalog();
    const { watch, loadSparePartsForCategory } = usePostAdAction();
    const { form, errors } = usePostAdFlow();

    const categoryId = String(watch("categoryId") || watch("category") || "");
    const spareParts = (watch("spareParts") || []) as string[];
    const deviceCondition = watch("deviceCondition");
    const hasSelection = deviceCondition === "power_on" || deviceCondition === "power_off";
    const sparePartsErrorMsg = errors.spareParts?.message as string | undefined;

    const handleSparePartsChange = useCallback((selectedIds: string | string[]) => {
        const ids = Array.isArray(selectedIds) ? selectedIds : [selectedIds];
        form.setValue("spareParts", ids, {
            shouldValidate: true,
            shouldDirty: true,
            shouldTouch: true,
        });
        if (ids.length > 0) {
            form.clearErrors("spareParts");
        }
        clearStep2GeneratedDetails(form);
    }, [form]);

    // Ensure spare parts catalog is loaded for the active category (e.g. on restored draft)
    useEffect(() => {
        if (categoryId && sparePartActiveCategoryId !== categoryId) {
            void loadSparePartsForCategory(categoryId);
        }
    }, [categoryId, sparePartActiveCategoryId, loadSparePartsForCategory]);

    const isSparePartsPending = Boolean(categoryId) && (isLoadingSpareParts || sparePartActiveCategoryId !== categoryId);
    const hasSpareParts = availableSpareParts.length > 0;
    const shouldRenderSparePartsSection = Boolean(categoryId) && (isSparePartsPending || Boolean(sparePartsError) || hasSpareParts);

    return (
        <div className="space-y-4">
            <section aria-labelledby="condition-heading" className="space-y-1.5" data-field="deviceCondition">
                <h2 id="condition-heading" className="sr-only">Device Condition</h2>
                <FieldRoot<FieldValues>
                    name="deviceCondition"
                    render={({ field }) => (
                        <FormItem className="flex flex-col gap-1.5 space-y-0">
                            <div className="flex flex-row items-center gap-x-4">
                                <FieldLabel className="text-body font-semibold m-0 leading-none text-foreground-secondary">
                                    Device Condition <span className="text-destructive">*</span>
                                </FieldLabel>
                                <FieldControl animateOnError>
                                    <RadioGroupPrimitive.Root
                                        onValueChange={(val) => {
                                            if (field.value !== val) {
                                                field.onChange(val);
                                                form.clearErrors("deviceCondition");
                                                clearStep2GeneratedDetails(form);
                                            }
                                        }}
                                        value={field.value || ""}
                                        className="flex"
                                        orientation="horizontal"
                                    >
                                        <div className="w-fit inline-flex items-center p-1 rounded-full border border-border bg-card shadow-2xs">
                                            <RadioGroupPrimitive.Item 
                                                value="power_off"
                                                title="Power Off"
                                                aria-label="Power Off"
                                                className={cn(
                                                    "group flex items-center justify-center gap-1.5 px-3 h-8 rounded-full transition-all duration-200 cursor-pointer select-none", 
                                                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-1",
                                                    "data-[state=checked]:bg-muted data-[state=checked]:shadow-inner"
                                                )}
                                            >
                                                <Leaf 
                                                    className={cn(
                                                        "w-4 h-4 transition-all duration-200 text-foreground-subtle", 
                                                        "group-data-[state=checked]:scale-110 group-data-[state=checked]:text-foreground"
                                                    )} 
                                                    strokeWidth={2.5}
                                                />
                                                <span className="text-caption font-medium text-foreground-subtle group-data-[state=checked]:text-foreground group-data-[state=checked]:font-semibold transition-colors duration-200">
                                                    Power Off
                                                </span>
                                            </RadioGroupPrimitive.Item>

                                            {!hasSelection && (
                                                <div className="flex items-center justify-center px-1 h-8 rounded-full pointer-events-none">
                                                    <Contrast className="w-4 h-4 text-primary" strokeWidth={2.5} />
                                                </div>
                                            )}

                                            <RadioGroupPrimitive.Item 
                                                value="power_on"
                                                title="Power On"
                                                aria-label="Power On"
                                                className={cn(
                                                    "group flex items-center justify-center gap-1.5 px-3 h-8 rounded-full transition-all duration-200 cursor-pointer select-none", 
                                                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-1",
                                                    "data-[state=checked]:bg-muted data-[state=checked]:shadow-inner"
                                                )}
                                            >
                                                <Zap 
                                                    className={cn(
                                                        "w-4 h-4 transition-all duration-200 text-destructive/80", 
                                                        "group-data-[state=checked]:scale-110 group-data-[state=checked]:text-destructive"
                                                    )} 
                                                    strokeWidth={2.5}
                                                />
                                                <span className="text-caption font-medium text-foreground-subtle group-data-[state=checked]:text-destructive group-data-[state=checked]:font-semibold transition-colors duration-200">
                                                    Power On
                                                </span>
                                            </RadioGroupPrimitive.Item>
                                        </div>
                                    </RadioGroupPrimitive.Root>
                                </FieldControl>
                            </div>
                            <FieldMessage className="text-caption text-destructive" />
                        </FormItem>
                    )}
                />
            </section>

            {shouldRenderSparePartsSection && (
                <section className="space-y-2" data-field="spareParts">
                    <label 
                        htmlFor="working-spare-parts-select" 
                        className="text-body font-semibold text-foreground-secondary leading-snug block mb-1.5"
                    >
                        Working Spare Parts <span className="text-destructive">*</span>
                    </label>
                    {isSparePartsPending ? (
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
                    ) : hasSpareParts ? (
                        <>
                            <CatalogSelectDropdown
                                id="working-spare-parts-select"
                                items={availableSpareParts}
                                value={spareParts}
                                onChange={handleSparePartsChange}
                                multiSelect={true}
                                error={sparePartsErrorMsg}
                                placeholder="Search or select working spare parts..."
                            />
                            {sparePartsErrorMsg && (
                                <p className="text-caption text-destructive mt-1.5">{sparePartsErrorMsg}</p>
                            )}
                        </>
                    ) : null}
                </section>
            )}
        </div>
    );
}
