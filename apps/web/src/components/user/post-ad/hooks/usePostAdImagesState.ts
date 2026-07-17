"use client";

import { useCallback } from "react";
import { UseFormReturn } from "react-hook-form";
import { AdPayload as PostAdFormData } from "@/schemas/adPayload.schema";
import { useListingImages } from "@/hooks/listings/useListingImages";
import type { ListingImage } from "@/types/listing";

export function usePostAdImagesState(
    form: UseFormReturn<PostAdFormData>,
    setValue: UseFormReturn<PostAdFormData>["setValue"]
) {
    const handleImagesChange = useCallback((images: ListingImage[]) => {
        const next = images.map((img) => img.preview);
        const current = Array.isArray(form.getValues("images")) ? form.getValues("images") as string[] : [];
        const isSync = current.length === next.length && current.every((v, i) => v === next[i]);
        if (isSync) return;
        setValue("images", next, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
    }, [form, setValue]);

    const imagesHook = useListingImages({ onImagesChange: handleImagesChange });

    return imagesHook;
}
