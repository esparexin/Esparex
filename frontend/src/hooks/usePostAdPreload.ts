"use client";

import { useEffect } from "react";
import type { Listing as Ad } from "@/lib/api/user/listings";
import { resolveCanonicalLocationId, sanitizeMongoObjectId } from "@/lib/listings/locationUtils";
import { toCanonicalGeoPoint } from "@/lib/location/coordinates";
import { TOAST_MESSAGES } from "@/config/toastMessages";
import logger from "@/lib/logger";
import { ListingImage } from "@/types/listing";
import { useListingEditPreload } from "@/components/user/shared/useListingEditPreload";
import { resolveCatalogEntityId } from "@/lib/listings/postingFormNormalization";

interface UsePostAdPreloadProps {
    editAdId?: string;
    isEditMode: boolean;
    setIsLoading: (val: boolean) => void;
    setLoadError: (msg: string | null) => void;
    setValue: any;
    setAdImages: (images: ListingImage[]) => void;
    setLocation: any;
    loadBrandsForCategory: (id: string) => Promise<void>;
    loadSparePartsForCategory: (id: string) => Promise<void>;
    setOriginalAdStatus?: (status: string) => void;
}

export function usePostAdPreload({
    editAdId,
    isEditMode,
    setIsLoading,
    setLoadError,
    setValue,
    setAdImages,
    setLocation,
    loadBrandsForCategory,
    loadSparePartsForCategory,
    setOriginalAdStatus,
}: UsePostAdPreloadProps) {
    useEffect(() => {
        if (editAdId && isEditMode) return;
        setIsLoading(false);
    }, [editAdId, isEditMode, setIsLoading]);

    useListingEditPreload<Ad>({
        editId: editAdId,
        enabled: isEditMode,
        onBeforeLoad: () => {
            setLoadError(null);
        },
        onLoadingChange: setIsLoading,
        onPayload: async (adData) => {
            if (setOriginalAdStatus && adData.status) {
                setOriginalAdStatus(adData.status);
            }

            const categoryId = resolveCatalogEntityId(adData.categoryId, adData.categoryName ?? adData.category);
            setValue("categoryId", categoryId);
            setValue("category", categoryId);

            const brandName = typeof adData.brandName === "string" ? adData.brandName : "";
            setValue("brand", brandName);

            setValue("title", adData.title);
            setValue("description", adData.description);
            setValue("price", Number(adData.price) || 0);
            setValue("screenSize", adData.screenSize || "");

            if (categoryId) {
                await Promise.all([
                    loadBrandsForCategory(categoryId),
                    loadSparePartsForCategory(categoryId),
                ]);
            }

            if (adData.location) {
                const canonicalGeoPoint = toCanonicalGeoPoint(adData.location.coordinates);
                const canonicalLocationId = resolveCanonicalLocationId(adData.location);

                setLocation(
                    adData.location.display || adData.location.city || "",
                    canonicalGeoPoint,
                    {
                        city: adData.location.city,
                        state: adData.location.state,
                        id: canonicalLocationId,
                    }
                );
                setValue("location", {
                    city: adData.location.city,
                    state: adData.location.state,
                    display: adData.location.display,
                    coordinates: canonicalGeoPoint,
                    locationId: canonicalLocationId,
                });
            }

            if (Array.isArray(adData.spareParts)) {
                const normalizedIds = adData.spareParts
                    .map((part: any) => sanitizeMongoObjectId(part))
                    .filter((partId: any): partId is string => Boolean(partId));
                setValue("spareParts", normalizedIds);
            }

            if (Array.isArray(adData.images)) {
                const mappedImages: ListingImage[] = adData.images.map((url: string) => ({
                    id: crypto.randomUUID(),
                    preview: url,
                    isRemote: true,
                }));
                setAdImages(mappedImages);
                setValue("images", mappedImages.map((image) => image.preview));
            }
        },
        onError: (error) => {
            logger.error("[Preload] Failed to load ad:", error);
            setLoadError(TOAST_MESSAGES.LOAD_FAILED);
        },
    });
}
