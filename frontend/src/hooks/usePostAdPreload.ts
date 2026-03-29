"use client";

import { useEffect, useRef } from "react";
import { getListingById, type Listing as Ad } from "@/lib/api/user/listings";
import { normalizeOptionalObjectId, resolveCanonicalLocationId } from "@/lib/listings/locationUtils";
import { toCanonicalGeoPoint } from "@/lib/location/coordinates";
import { TOAST_MESSAGES } from "@/config/toastMessages";
import logger from "@/lib/logger";
import { ListingImage } from "@/types/listing";

interface UsePostAdPreloadProps {
    editAdId?: string;
    isEditMode: boolean;
    setIsLoading: (val: boolean) => void;
    setLoadError: (msg: string | null) => void;
    setValue: any;
    setSpareParts: (parts: string[]) => void;
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
    setSpareParts,
    setAdImages,
    setLocation,
    loadBrandsForCategory,
    loadSparePartsForCategory,
    setOriginalAdStatus,
}: UsePostAdPreloadProps) {
    const loadedAdIdRef = useRef<string | null>(null);

    useEffect(() => {
        if (!editAdId || !isEditMode) {
            loadedAdIdRef.current = null;
            return;
        }

        if (loadedAdIdRef.current === editAdId) {
            return;
        }
        loadedAdIdRef.current = editAdId;

        const loadAdData = async () => {
            setIsLoading(true);
            setLoadError(null);
            try {
                const data = await getListingById(editAdId);
                if (data) {
                    const adData = data as Ad;

                    // 0. Capture original status for location lock
                    if (setOriginalAdStatus && adData.status) {
                        setOriginalAdStatus(adData.status);
                    }

                    // 1. Resolve Category ID
                    const catId = normalizeOptionalObjectId(
                        (adData.category as any)?.id || 
                        (adData.category as any)?._id || 
                        (typeof adData.category === 'string' ? adData.category : undefined) ||
                        adData.categoryId
                    ) || "";
                    setValue("categoryId", catId);
                    setValue("category", catId);

                    // 2. Resolve Brand
                    const brandName = typeof adData.brand === "string" ? adData.brand : (adData.brandId as any)?.name || "";
                    setValue("brand", brandName);
                    
                    // 3. Set basic fields
                    setValue("title", adData.title);
                    setValue("description", adData.description);
                    setValue("price", Number(adData.price) || 0);
                    setValue("screenSize", adData.screenSize || "");

                    // 4. Load Catalog Data
                    if (catId) {
                        await loadBrandsForCategory(catId);
                        await loadSparePartsForCategory(catId);
                    }

                    // 5. Preload Location
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

                    // 6. Preload Spare Parts
                    if (Array.isArray(adData.spareParts)) {
                        const normalizedIds = adData.spareParts
                            .map((part: any) => normalizeOptionalObjectId(part))
                            .filter((partId: any): partId is string => Boolean(partId));
                        setSpareParts(normalizedIds);
                        setValue("spareParts", normalizedIds);
                    }

                    // 7. Preload Images
                    if (Array.isArray(adData.images)) {
                        const mappedImgs: ListingImage[] = adData.images.map((url: string) => ({
                            id: crypto.randomUUID(),
                            preview: url,
                            isRemote: true
                        }));
                        setAdImages(mappedImgs);
                        setValue("images", mappedImgs.map(i => i.preview));
                    }
                }
            } catch (err) {
                logger.error("[Preload] Failed to load ad:", err);
                loadedAdIdRef.current = null; // Allow retry after transient failures (e.g., 429).
                setLoadError(TOAST_MESSAGES.LOAD_FAILED);
            } finally {
                setIsLoading(false);
            }
        };
        loadAdData();
    }, [editAdId, isEditMode, loadBrandsForCategory, loadSparePartsForCategory, setValue, setLocation, setAdImages, setIsLoading, setLoadError, setSpareParts]);
}
