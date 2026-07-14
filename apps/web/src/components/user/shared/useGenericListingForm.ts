"use client";

import { FieldValues, UseFormReturn } from "react-hook-form";
import logger from "@/lib/logger";
import { 
    createRemoteListingImages,
} from "./listingFormShared";
import { useBusiness } from "@/hooks/useBusiness";
import { useAuth } from "@/context/AuthContext";
import { buildGenericListingEditResetValues } from "@/lib/listings/postingFormNormalization";
import { useListingEditPreload } from "./useListingEditPreload";

import { useListingImages } from "@/hooks/listings/useListingImages";

interface UseGenericListingFormProps<T extends FieldValues> {
    form: UseFormReturn<T>;
    editId?: string;
    onDataLoaded?: (payload: Record<string, unknown>) => Promise<void> | void;
}

export function useGenericListingForm<T extends FieldValues>({
    form,
    editId,
    onDataLoaded,
}: UseGenericListingFormProps<T>) {
    const { user } = useAuth();
    const { businessData } = useBusiness(user, undefined, {
        includeStats: false,
    });
    const {
        listingImages: images,
        setListingImages: setImages,
        addImages,
        removeImage,
    } = useListingImages({
        maxImages: 10,
    });
    const { isFetchingData } = useListingEditPreload<Record<string, unknown>>({
        editId,
        onPayload: async (payload) => {
            if (Array.isArray(payload.images) && payload.images.length > 0) {
                setImages(createRemoteListingImages(payload.images));
            }

            if (onDataLoaded) {
                await onDataLoaded(payload);
                return;
            }

            form.reset(buildGenericListingEditResetValues(payload) as Parameters<typeof form.reset>[0]);
        },
        onError: (error) => {
            logger.error("Failed to load listing", error);
        },
    });

    return {
        images,
        setImages,
        addImages,
        removeImage,
        isFetchingData,
        businessData,
    };
}
