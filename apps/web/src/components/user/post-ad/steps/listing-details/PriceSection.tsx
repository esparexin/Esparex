"use client";

import { useFormContext, useWatch } from "react-hook-form";
import { ListingPriceField } from "@/components/user/shared/ListingPriceField";
import { AdPayload as PostAdFormData } from "@/schemas/adPayload.schema";
import { useCallback } from "react";

export function PriceSection() {
    const { setValue, trigger } = useFormContext<PostAdFormData>();
    const isFree = useWatch({ name: "isFree" });

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
                name="price"
                label="Set your price"
                required
                placeholder="Enter amount"
                showCurrencySymbol
                isFree={isFree}
                onToggleFree={toggleFree}
            />
        </section>
    );
}
