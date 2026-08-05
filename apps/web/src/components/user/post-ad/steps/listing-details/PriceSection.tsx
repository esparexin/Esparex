"use client";

import { useFormContext, useWatch } from "react-hook-form";
import { ListingPriceField } from "@/components/user/shared/ListingFormFields";
import { AdPayload as PostAdFormData } from "@/schemas/adPayload.schema";
import { useStepFieldError } from "../common/Utils";
import { useCallback } from "react";

export function PriceSection() {
    const { register, setValue, trigger } = useFormContext<PostAdFormData>();
    const isFree = useWatch({ name: "isFree" });

    const getFieldError = useStepFieldError(2);
    const priceError = getFieldError("price");

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
                registerProps={register("price", {
                    setValueAs: (v: unknown) => {
                        if (v === "" || v === null || v === undefined) return undefined;
                        const n = parseFloat(String(v));
                        return isNaN(n) ? undefined : n;
                    },
                })}
                placeholder="Enter amount"
                showCurrencySymbol
                isFree={isFree}
                onToggleFree={toggleFree}
            />
        </section>
    );
}
