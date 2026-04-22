"use client";

import React from "react";
import { UseFormReturn } from "react-hook-form";
import logger from "@/lib/logger";
import { 
    createRemoteListingImages,
} from "./listingFormShared";
import type { ListingImage } from "@/types/listing";
import { useBusiness } from "@/hooks/useBusiness";
import { useAuth } from "@/context/AuthContext";
import { buildGenericListingEditResetValues } from "@/lib/listings/postingFormNormalization";
import { useListingEditPreload } from "./useListingEditPreload";

interface UseGenericListingFormProps<T extends Record<string, any>> {
    form: UseFormReturn<T>;
    editId?: string;
    onDataLoaded?: (payload: any) => void;
}

export function useGenericListingForm<T extends Record<string, any>>({
    form,
    editId,
    onDataLoaded,
}: UseGenericListingFormProps<T>) {
    const { user } = useAuth();
    const { businessData } = useBusiness(user, undefined, {
        includeStats: false,
    });
    const [images, setImages] = React.useState<ListingImage[]>([]);
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

            form.reset(buildGenericListingEditResetValues(payload) as any);
        },
        onError: (error) => {
            logger.error("Failed to load listing", error);
        },
    });

    return {
        images,
        setImages,
        isFetchingData,
        businessData,
    };
}
