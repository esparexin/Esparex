"use client";

import { useFormContext, useWatch } from "react-hook-form";
import { usePostAdFlow } from "../../context";
import { ListingPriceField } from "@/components/user/shared/ListingFormFields";
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
            <ListingPriceField
                label="Set your price"
                required
                error={priceError as string}
                registerProps={register("price", { valueAsNumber: true })}
                placeholder="Enter amount"
                showCurrencySymbol
                isFree={isFree}
                onToggleFree={toggleFree}
            />
        </section>
    );
}
