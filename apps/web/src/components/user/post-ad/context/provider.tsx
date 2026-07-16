"use client";

import { useState, useEffect, useCallback, useMemo, ReactNode } from "react";
import type { Listing } from "@/lib/api/user/listings/normalizer";
import type { ListingImage, ListingLocation } from "@/types/listing";
import type { AdPayload as PostAdFormData } from "@/schemas/adPayload.schema";
import { suppressGoogleMapsRetryErrors } from "@/lib/suppress-google-maps-errors";
import { normalizeOptionalObjectId } from "@/lib/normalizeOptionalObjectId";
import { useNavigation } from "@/context/NavigationContext";
import { LISTING_TYPE } from '@esparex/shared';
import { useBrandCatalog } from "@/hooks/listings/useBrandCatalog";
import { useCategorySchemaCatalog } from "@/hooks/listings/useCategorySchemaCatalog";
import { useListingCategories } from "@/hooks/listings/useListingCategories";
import { useListingImages } from "@/hooks/listings/useListingImages";
import { useListingLocation } from "@/hooks/listings/useListingLocation";
import { useSparePartCatalog } from "@/hooks/listings/useSparePartCatalog";
import { usePostAdForm } from "@/hooks/usePostAdForm";
import { usePostAdValidation } from "@/hooks/usePostAdValidation";
import { usePostAdAiGeneration } from "../hooks/usePostAdAiGeneration";
import { useCategoryDependents } from "../hooks/useCategoryDependents";
import { usePostAdStepNavigation } from "../hooks/usePostAdStepNavigation";
import { usePostAdSparePartSelection } from "../hooks/usePostAdSparePartSelection";
import { usePostAdSubmissionFlow } from "../hooks/usePostAdSubmissionFlow";
import { PostAdContextShell } from "./context";
import type { PostAdCatalogState, PostAdLocationState, PostAdImagesState, PostAdFlowState, PostAdStateContextType, PostAdActionContextType } from "./types";

export function PostAdProvider({
    children, editAdId, formHook,
}: {
    children: ReactNode; editAdId?: string; formHook: ReturnType<typeof usePostAdForm>;
}) {
    const validationHook = usePostAdValidation();
    const { form, register, control, errors, watch, setValue, trigger } = formHook;
    const [userHasInteracted, setUserHasInteracted] = useState(false);
    const [stepValidationAttempts, setStepValidationAttempts] = useState<Record<number, boolean>>({});

    const categoryCatalog = useListingCategories({ listingType: LISTING_TYPE.AD, onError: validationHook.setFormError });
    const brandCatalog = useBrandCatalog({ categoryMap: categoryCatalog.categoryMap, onError: validationHook.setFormError });
    const sparePartCatalog = useSparePartCatalog({ listingType: LISTING_TYPE.AD, onError: validationHook.setFormError });
    const categorySchemaCatalog = useCategorySchemaCatalog();
    const { dynamicCategories, categoryMap } = categoryCatalog;
    const { brandMap, availableBrands, availableModels, availableSizes, loadBrandsForCategory, loadModelsForBrand, refreshBrands, brandsError } = brandCatalog;
    const { availableSpareParts, isLoadingSpareParts, sparePartsError, loadSparePartsForCategory } = sparePartCatalog;
    const { categorySchema, loadCategorySchema } = categorySchemaCatalog;

    const handleImagesChange = useCallback((images: ListingImage[]) => {
        const next = images.map((img) => img.preview);
        const current = Array.isArray(form.getValues("images")) ? form.getValues("images") as string[] : [];
        const isSync = current.length === next.length && current.every((v, i) => v === next[i]);
        if (isSync) return;
        setValue("images", next, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
    }, [form, setValue]);

    const imagesHook = useListingImages({ onImagesChange: handleImagesChange });

    const handleLocationChange = useCallback((location: ListingLocation | null) => {
        setValue("location", location as PostAdFormData["location"], { shouldValidate: true, shouldDirty: true });
    }, [setValue]);

    const locationHook = useListingLocation({ onLocationChange: handleLocationChange });
    const isEditMode = !!editAdId;
    const [mode, setMode] = useState<'create' | 'edit'>(isEditMode ? 'edit' : 'create');
    const [listingId, setListingId] = useState<string | undefined>(editAdId);
    const [currentStep, setCurrentStep] = useState(isEditMode ? 2 : 1);
    const [originalAdStatus, setOriginalAdStatus] = useState<string | null>(null);
    const isLocationLocked = isEditMode && (originalAdStatus === 'live' || originalAdStatus === 'pending');
    const [isLoading, setIsLoading] = useState(isEditMode);
    const [brandIsPending, setBrandIsPending] = useState(false);
    const [submittedAd, setSubmittedAd] = useState<Listing | null>(null);
    const { listingImages, setListingImages } = imagesHook;
    const { listingLocation, setLocation, coordinates, locationDisplay } = locationHook;
    const { loadError, setLoadError, formError, setFormError } = validationHook;
    const { requiresScreenSize, handleCategoryChange, handleBrandChange, handleModelChange, clearCategoryDependents } = useCategoryDependents(
        form as any, categoryMap, brandMap as any, setFormError, setBrandIsPending, loadBrandsForCategory, loadSparePartsForCategory, loadCategorySchema, loadModelsForBrand
    );
    const { setIsDirty } = useNavigation();

    useEffect(() => { const cleanup = suppressGoogleMapsRetryErrors(); return cleanup; }, []);
    useEffect(() => {
        // After a successful submission, the success modal becomes the terminal UI.
        // The navigation guard must remain disabled until resetToCreateMode() starts a fresh session.
        if (submittedAd) {
            setIsDirty(false);
            return;
        }
        setIsDirty(form.formState.isDirty || listingImages.length > 0);
    }, [form.formState.isDirty, listingImages.length, setIsDirty, submittedAd]);
    useEffect(() => { return () => setIsDirty(false); }, [setIsDirty]);

    useEffect(() => {
        if (isLoadingSpareParts || availableSpareParts.length === 0) return;
        const currentParts = (form.getValues("spareParts") || []) as string[];
        if (currentParts.length === 0) return;
        const validIds = new Set(availableSpareParts.map((p) => normalizeOptionalObjectId(p.id)).filter((id): id is string => Boolean(id)));
        const next = currentParts.filter((id) => validIds.has(id));
        if (next.length !== currentParts.length) form.setValue("spareParts", next, { shouldDirty: true });
    }, [availableSpareParts, isLoadingSpareParts, form]);

    const initializeFromListing = useCallback(async (data: Listing) => {
        setMode('edit'); setListingId(String(data.id || (data as any)._id || "")); setCurrentStep(2);
        if (setOriginalAdStatus && data.status) setOriginalAdStatus(data.status);
        clearCategoryDependents();
        const categoryId = data.categoryId || data.category;
        setValue("categoryId", categoryId); setValue("category", categoryId); setValue("brand", typeof data.brandName === "string" ? data.brandName : ""); setValue("brandId", data.brandId || "");
        setValue("model", typeof data.modelName === "string" ? data.modelName : ""); setValue("modelId", data.modelId || "");
        setValue("title", data.title || ""); setValue("description", data.description || ""); setValue("price", Number(data.price) || 0); setValue("screenSize", data.screenSize || "");
        if (categoryId) { const p: Promise<any>[] = [loadBrandsForCategory(categoryId), loadSparePartsForCategory(categoryId)]; if (data.brandId) p.push(loadModelsForBrand(data.brandId, categoryId)); await Promise.all(p); }
        if (data.location) setValue("location", { city: data.location.city, state: data.location.state, display: data.location.display, coordinates: data.location.coordinates, locationId: (data.location.locationId as string) || (data.location as any).id || undefined });
        if (Array.isArray(data.images)) { const mappedIds = data.images.map((url: string) => ({ id: crypto.randomUUID(), preview: url, isRemote: true })); setListingImages(mappedIds); setValue("images", mappedIds.map((i) => i.preview)); }
        setIsLoading(false);
    }, [clearCategoryDependents, setValue, loadBrandsForCategory, loadSparePartsForCategory, loadModelsForBrand, setListingImages]);

    const resetToCreateMode = useCallback(() => { setMode('create'); setListingId(undefined); setCurrentStep(1); form.reset(); (imagesHook as any).setListingImages([]); setSubmittedAd(null); }, [form, imagesHook]);
    const { generateDescription, isGeneratingAI } = usePostAdAiGeneration(form as any, categoryMap, availableSpareParts, setFormError);
    const { toggleAllSpareParts, toggleSparePart } = usePostAdSparePartSelection(form as any, availableSpareParts);
    const { nextStep, prevStep } = usePostAdStepNavigation({ form: form as any, currentStep, setCurrentStep, setStepValidationAttempts, requiresScreenSize, categoryFilters: categorySchema?.filters ?? [], trigger });
    const { submitAd, isSubmitting } = usePostAdSubmissionFlow({ form: form as any, listingImages, setListingImages, isEditMode, editAdId, isLocationLocked, setFormError, setSubmittedAd });
    const { addImages, removeImage } = imagesHook;

    const catalogState = useMemo<PostAdCatalogState>(() => ({ dynamicCategories, categoryMap, availableBrands, brandMap, availableModels, availableSizes, availableSpareParts, isLoadingSpareParts, categorySchema, requiresScreenSize, sparePartsError, brandsError, brandIsPending }), [dynamicCategories, categoryMap, availableBrands, brandMap, availableModels, availableSizes, availableSpareParts, isLoadingSpareParts, categorySchema, requiresScreenSize, sparePartsError, brandsError, brandIsPending]);
    const locationState = useMemo<PostAdLocationState>(() => ({ listingLocation, locationDisplay: locationDisplay || "", coordinates, isLocationLocked }), [listingLocation, locationDisplay, coordinates, isLocationLocked]);
    const imagesState = useMemo<PostAdImagesState>(() => ({ listingImages, isUploadingImages: imagesHook.isUploadingImages, imageUploadError: imagesHook.imageUploadError }), [listingImages, imagesHook.isUploadingImages, imagesHook.imageUploadError]);
    const flowState = useMemo<PostAdFlowState>(() => ({ currentStep, stepValidationAttempts, isLoading, isGeneratingAI, isSubmitting, isEditMode, userHasInteracted, loadError, formError, submittedAd, form, control, errors, mode, listingId }), [currentStep, stepValidationAttempts, isLoading, isGeneratingAI, isSubmitting, isEditMode, userHasInteracted, loadError, formError, submittedAd, form, control, errors, mode, listingId]);
    const stateValue = useMemo<PostAdStateContextType>(() => ({ ...flowState, ...catalogState, ...locationState, ...imagesState }), [flowState, catalogState, locationState, imagesState]);
    const actionValue = useMemo<PostAdActionContextType>(() => ({ setCurrentStep, nextStep, prevStep, handleCategoryChange, handleBrandChange, handleModelChange, toggleSparePart, toggleAllSpareParts, addImages, removeImage, setLocation, loadBrandsForCategory, loadModelsForBrand, loadSparePartsForCategory, loadCategorySchema, refreshBrands, generateDescription, submitAd, setUserHasInteracted, setLoadError, setFormError, setImageUploadError: imagesHook.setImageUploadError, setSubmittedAd, setValue, register, watch, initializeFromListing, resetToCreateMode }), [setCurrentStep, nextStep, prevStep, handleCategoryChange, handleBrandChange, handleModelChange, toggleSparePart, toggleAllSpareParts, addImages, removeImage, setLocation, loadBrandsForCategory, loadModelsForBrand, loadSparePartsForCategory, loadCategorySchema, refreshBrands, generateDescription, submitAd, setUserHasInteracted, setLoadError, setFormError, imagesHook.setImageUploadError, setSubmittedAd, setValue, register, watch, initializeFromListing, resetToCreateMode]);

    return (
        <PostAdContextShell catalogState={catalogState} locationState={locationState} imagesState={imagesState} flowState={flowState} actionValue={actionValue} stateValue={stateValue}>
            {children}
        </PostAdContextShell>
    );
}
