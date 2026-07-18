"use client";

import { useCallback } from "react";
import { UseFormReturn } from "react-hook-form";
import { AdPayload as PostAdFormData } from "@/schemas/adPayload.schema";
import { useListingLocation } from "@/hooks/listings/useListingLocation";
import type { ListingLocation } from "@/types/listing";

export function usePostAdLocationState(
    setValue: UseFormReturn<PostAdFormData>["setValue"]
) {
    const handleLocationChange = useCallback((location: ListingLocation | null) => {
        setValue("location", location as PostAdFormData["location"], { shouldValidate: true, shouldDirty: true });
    }, [setValue]);

    const locationHook = useListingLocation({ onLocationChange: handleLocationChange });

    return locationHook;
}
