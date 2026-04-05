"use client";

import React from "react";
import { UseFormReturn } from "react-hook-form";
import logger from "@/lib/logger";
import { 
    createRemoteListingImages, 
    extractEntityId, 
} from "./listingFormShared";
import { getListingById } from "@/lib/api/user/listings";
import type { ListingImage } from "@/types/listing";
import { useBusiness } from "@/hooks/useBusiness";
import { useAuth } from "@/context/AuthContext";

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
    const [isFetchingData, setIsFetchingData] = React.useState(!!editId);

    // 1. Load existing listing for edit
    React.useEffect(() => {
        if (!editId) return;
        let isMounted = true;
        const load = async () => {
            try {
                const payload = await getListingById(editId);
                if (isMounted && payload) {
                    if (payload.images?.length) {
                        setImages(createRemoteListingImages(payload.images));
                    }
                    if (onDataLoaded) {
                        onDataLoaded(payload);
                    } else {
                        // Default reset if no custom handler
                        form.reset({
                            ...payload,
                            categoryId: extractEntityId(payload.category || payload.categoryId),
                            brandId: extractEntityId(payload.brand || payload.brandId),
                        } as any);
                    }
                }
            } catch (e) {
                logger.error("Failed to load listing", e);
            } finally {
                if (isMounted) setIsFetchingData(false);
            }
        };
        load();
        return () => { isMounted = false; };
    }, [editId, form, onDataLoaded]);

    return {
        images,
        setImages,
        isFetchingData,
        businessData,
    };
}
