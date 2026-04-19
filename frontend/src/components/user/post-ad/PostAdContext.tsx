"use client";

import {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
    useCallback,
    useMemo
} from "react";
import type { SparePart, DeviceModel } from "@/lib/api/user/masterData";
import { suppressGoogleMapsRetryErrors } from "@/lib/suppress-google-maps-errors";
import { normalizeOptionalObjectId } from "@/lib/normalizeOptionalObjectId";
// FORM imports
import { useNavigation } from "@/context/NavigationContext";
import { UseFormReturn, Control, FieldErrors, UseFormRegister, UseFormWatch, UseFormSetValue, Path } from "react-hook-form";
import { AdPayload as PostAdFormData } from "@/schemas/adPayload.schema";
import { CategoryFilter } from "@shared/schemas/catalog.schema";
import { Listing } from "@/lib/api/user/listings/normalizer";
import { GeoJSONPoint } from "@/types/location";

// Custom hooks
import { useListingCatalog } from "@/hooks/listings/useListingCatalog";
import { useListingImages } from "@/hooks/listings/useListingImages";
import { useListingLocation } from "@/hooks/listings/useListingLocation";
import { useListingSubmission } from "@/hooks/listings/useListingSubmission";
import { usePostAdPreload } from "@/hooks/usePostAdPreload";
import { usePostAdForm } from "@/hooks/usePostAdForm";
import { usePostAdValidation } from "@/hooks/usePostAdValidation";
import { usePostAdFormNormalization } from "./hooks/usePostAdFormNormalization";
import { useImageUploadWorkflow } from "./hooks/useImageUploadWorkflow";
import { usePostAdAiGeneration } from "./hooks/usePostAdAiGeneration";
import { useCategoryDependents } from "./hooks/useCategoryDependents";
import {
    ListingImage,
    ListingCategory,
    ListingLocation
} from "@/types/listing";
import {
    AdPayloadSchema as postAdSchema,
    PartialAdPayloadSchema as partialAdSchema
} from "@/schemas/adPayload.schema";
import { createListing, updateListing } from "@/lib/api/user/listings";

/* ===================== CONTEXT TYPE ===================== */

export interface PostAdContextType {
    currentStep: number;
    setCurrentStep: (step: number) => void;
    stepValidationAttempts: Record<number, boolean>;

    // RHF Methods
    form: UseFormReturn<PostAdFormData>;
    register: UseFormRegister<PostAdFormData>;
    control: Control<PostAdFormData>;
    errors: FieldErrors<PostAdFormData>;
    watch: UseFormWatch<PostAdFormData>;
    setValue: UseFormSetValue<PostAdFormData>;

    // Navigation
    nextStep: () => Promise<void>;
    prevStep: () => void;

    // Logic Wrappers
    handleCategoryChange: (id: string) => Promise<void>;
    handleBrandChange: (name: string) => Promise<void>;

    brandIsPending: boolean;

    // Spare Parts
    spareParts: string[];
    toggleSparePart: (partId: string) => void;
    toggleAllSpareParts: (selectAll: boolean) => void;

    // Images
    listingImages: ListingImage[];
    addImages: (files: File[]) => void;
    removeImage: (index: number) => void;

    // Location
    listingLocation: ListingLocation | null;
    locationDisplay: string;
    coordinates: GeoJSONPoint | null | undefined;
    setLocation: (
        display: string,
        coords?: GeoJSONPoint | undefined,
        meta?: { city?: string; state?: string; id?: string }
    ) => void;

    // Catalog Data
    dynamicCategories: ListingCategory[];
    categoryMap: Record<string, ListingCategory>;
    availableBrands: string[];
    availableModels: DeviceModel[];
    availableSizes: string[];
    availableSpareParts: SparePart[];
    isLoadingSpareParts: boolean;
    categorySchema: {
        categoryId: string;
        categoryName: string;
        filters: CategoryFilter[];
    } | null;
    requiresScreenSize: boolean;

    loadBrandsForCategory: (categoryId: string) => Promise<void>;
    loadModelsForBrand: (brandId?: string, categoryId?: string, search?: string) => Promise<void>;
    loadSparePartsForCategory: (categoryId: string) => Promise<void>;
    loadCategorySchema: (categoryId: string) => Promise<void>;

    sparePartsError: string | null;
    brandsError: string | null;

    generateDescription: (targetField: 'title' | 'description') => Promise<void>;
    submitAd: () => Promise<void>;

    isLoading: boolean;
    isUploadingImages: boolean;
    isSubmitting: boolean;
    isEditMode: boolean;
    isLocationLocked: boolean;
    userHasInteracted: boolean;
    setUserHasInteracted: (val: boolean) => void;
    loadError: string | null;
    setLoadError: (message: string | null) => void;
    formError: string | null;
    setFormError: (message: string | null) => void;
    imageUploadError: string | null;
    setImageUploadError: (message: string | null) => void;

    submittedAd: Listing | null;
    setSubmittedAd: (ad: Listing | null) => void;
}

export type PostAdStateContextType = Omit<
    PostAdContextType,
    | "setCurrentStep"
    | "nextStep"
    | "prevStep"
    | "handleCategoryChange"
    | "handleBrandChange"
    | "toggleSparePart"
    | "toggleAllSpareParts"
    | "addImages"
    | "removeImage"
    | "setLocation"
    | "loadBrandsForCategory"
    | "loadModelsForBrand"
    | "loadSparePartsForCategory"
    | "loadCategorySchema"
    | "generateDescription"
    | "submitAd"
    | "setUserHasInteracted"
    | "setLoadError"
    | "setFormError"
    | "setImageUploadError"
    | "setSubmittedAd"
    | "setValue"
    | "register"
    | "watch"
>;

export type PostAdActionContextType = Pick<
    PostAdContextType,
    | "setCurrentStep"
    | "nextStep"
    | "prevStep"
    | "handleCategoryChange"
    | "handleBrandChange"
    | "toggleSparePart"
    | "toggleAllSpareParts"
    | "addImages"
    | "removeImage"
    | "setLocation"
    | "loadBrandsForCategory"
    | "loadModelsForBrand"
    | "loadSparePartsForCategory"
    | "loadCategorySchema"
    | "generateDescription"
    | "submitAd"
    | "setUserHasInteracted"
    | "setLoadError"
    | "setFormError"
    | "setImageUploadError"
    | "setSubmittedAd"
    | "setValue"
    | "register"
    | "watch"
>;

const PostAdStateContext = createContext<PostAdStateContextType | undefined>(undefined);
const PostAdActionContext = createContext<PostAdActionContextType | undefined>(undefined);

export function PostAdProvider({
    children,
    editAdId,
    formHook,
}: {
    children: ReactNode;
    editAdId?: string;
    formHook: ReturnType<typeof usePostAdForm>; 
}) {
    // ... rest of the component ...
    const validationHook = usePostAdValidation();
    const { form, register, control, errors, watch, setValue, trigger } = formHook;
    const [userHasInteracted, setUserHasInteracted] = useState(false);
    const [stepValidationAttempts, setStepValidationAttempts] = useState<Record<number, boolean>>({});

    const catalogHook = useListingCatalog({ 
        listingType: 'postad', 
        onError: validationHook.setFormError 
    });

    const handleImagesChange = useCallback((images: ListingImage[]) => {
        const nextImagePreviews = images.map((img) => img.preview);
        const currentImagePreviews = Array.isArray(form.getValues("images"))
            ? (form.getValues("images") as string[])
            : [];

        const isHydrationOnlySync =
            currentImagePreviews.length === nextImagePreviews.length &&
            currentImagePreviews.every((value, index) => value === nextImagePreviews[index]);

        if (isHydrationOnlySync) {
            return;
        }

        setValue("images", nextImagePreviews, {
            shouldValidate: true,
            shouldDirty: true,
            shouldTouch: true,
        });
    }, [form, setValue]);

    const imagesHook = useListingImages({
        onImagesChange: handleImagesChange
    });

    const locationHook = useListingLocation({
        onLocationChange: (location) => {
            setValue("location", location as PostAdFormData["location"], { 
                shouldValidate: true, 
                shouldDirty: true 
            });
        }
    });

    // Navigation State for 9-Step Flow
    const isEditMode = !!editAdId;
    const [currentStep, setCurrentStep] = useState(isEditMode ? 2 : 1);

    // Track the original ad status loaded during edit preload
    const [originalAdStatus, setOriginalAdStatus] = useState<string | null>(null);

    // Location is locked once ad reaches pending or live — trust signal, cannot be silently changed
    const isLocationLocked = isEditMode && (originalAdStatus === 'live' || originalAdStatus === 'pending');

    // State for spare parts and pending states
    const [spareParts, setSpareParts] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [brandIsPending, setBrandIsPending] = useState(false);
    const [submittedAd, setSubmittedAd] = useState<Listing | null>(null);

    // Derived state from images hook
    const { listingImages, setListingImages } = imagesHook;

    // Destructure location hook
    const { listingLocation, setLocation, coordinates, locationDisplay } = locationHook;

    // Destructure catalog hook
    const { 
        dynamicCategories, 
        categoryMap, 
        availableBrands, 
        availableModels,
        availableSizes, 
        availableSpareParts, 
        isLoadingSpareParts, 
        categorySchema, 
        loadBrandsForCategory, 
        loadModelsForBrand,
        loadSparePartsForCategory, 
        loadCategorySchema,
        sparePartsError,
        brandsError
    } = catalogHook;

    // Reactive category value — calling watch() inside useMemo is not reactive
    // (watch reference is stable). Subscribe at render scope instead.
    const { loadError, setLoadError, formError, setFormError } = validationHook;

    const { requiresScreenSize, handleCategoryChange, handleBrandChange } = useCategoryDependents(
        form, categoryMap, catalogHook.brandMap,
        setFormError, setBrandIsPending, setSpareParts,
        loadBrandsForCategory, loadSparePartsForCategory, loadCategorySchema
    );

    // Submission logic in dedicated hook
    const { setIsDirty } = useNavigation();

    const { buildEditAdPayload, normalizeIdentityFieldsBeforeSubmit } = usePostAdFormNormalization(
        form,
        isLocationLocked,
        setSpareParts
    );

    const submitAdApiCall = useCallback((payload: PostAdFormData, options?: { idempotencyKey?: string }) => {
        const listingData = payload as unknown as Partial<Listing>;
        return (isEditMode && editAdId) 
            ? updateListing(editAdId, buildEditAdPayload(payload))
            : createListing(listingData, options);
    }, [buildEditAdPayload, isEditMode, editAdId]);

    const { onValidSubmit, isSubmitting } = useListingSubmission({
        form,
        listingImages,
        isEditMode,
        editId: editAdId,
        schema: postAdSchema,
        partialSchema: partialAdSchema,
        submitFn: submitAdApiCall,
        onSuccess: (ad) => setSubmittedAd(ad),
        onError: setFormError
    });

    /* ---------- INIT ---------- */
    useEffect(() => {
        const cleanup = suppressGoogleMapsRetryErrors();
        return cleanup;
    }, []);

    // Sync dirty state with navigation context
    useEffect(() => {
        const isCurrentlyDirty = form.formState.isDirty || listingImages.length > 0;
        setIsDirty(isCurrentlyDirty);
    }, [form.formState.isDirty, listingImages.length, setIsDirty]);

    useEffect(() => {
        return () => {
            setIsDirty(false);
        };
    }, [setIsDirty]);

    // 1. Keep spare parts in sync with available parts (Pure filter)
    useEffect(() => {
        const validIds = new Set(
            availableSpareParts
                .map((part) => normalizeOptionalObjectId(part.id))
                .filter((partId): partId is string => Boolean(partId))
        );
        setSpareParts((prev) => {
            const next = prev.filter((partId) => validIds.has(partId));
            return next.length !== prev.length ? next : prev;
        });
    }, [availableSpareParts]);

    // 2. Synchronize the local spareParts state with the RHF form value
    useEffect(() => {
        const fieldValue = (availableSpareParts.length === 0 && !isLoadingSpareParts) ? undefined : spareParts;
        setValue("spareParts", fieldValue as PostAdFormData["spareParts"], { 
            shouldValidate: userHasInteracted, 
            shouldDirty: true 
        });
    }, [spareParts, availableSpareParts.length, isLoadingSpareParts, setValue, userHasInteracted]);

    /* ---------- EDIT MODE PRELOADING ---------- */
    usePostAdPreload({
        editAdId,
        isEditMode,
        setIsLoading,
        setLoadError,
        setOriginalAdStatus,
        setValue,
        setSpareParts,
        setAdImages: setListingImages,
        setLocation,
        loadBrandsForCategory,
        loadSparePartsForCategory,
    });





    /* ---------- SPARE PARTS ---------- */
    /* ---------- GENERATE AI ---------- */
    const { generateDescription } = usePostAdAiGeneration(form, categoryMap, setIsLoading, setFormError);


    const toggleAllSpareParts = useCallback((selectAll: boolean) => {
        if (selectAll) {
            const ids = availableSpareParts
                .map((part) => normalizeOptionalObjectId(part.id))
                .filter((partId): partId is string => Boolean(partId));
            const distinct = Array.from(new Set(ids));
            setSpareParts(distinct);
        } else {
            setSpareParts([]);
        }
    }, [availableSpareParts]);

    const toggleSparePart = useCallback((partId: string) => {
        const normalizedPartId = normalizeOptionalObjectId(partId);
        if (!normalizedPartId) return;
        setSpareParts((prev) => 
            prev.includes(normalizedPartId)
                ? prev.filter((id) => id !== normalizedPartId)
                : [...prev, normalizedPartId]
        );
    }, []);

    const nextStep = useCallback(async () => {
        setStepValidationAttempts((prev) =>
            prev[currentStep] ? prev : { ...prev, [currentStep]: true }
        );

        // Step 1: categoryId and deviceCondition are optional in the base schema
        // (for partial saves / edit mode), so we gate them manually here before
        // running the schema-level trigger.
        if (currentStep === 1) {
            const { categoryId: catId, deviceCondition: dc } = form.getValues();
            let hasErrors = false;
            if (!catId) {
                form.setError("categoryId" as Path<PostAdFormData>, { type: "manual", message: "Please select a category" });
                hasErrors = true;
            }
            if (!dc) {
                form.setError("deviceCondition" as Path<PostAdFormData>, { type: "manual", message: "Please select device condition" });
                hasErrors = true;
            }
            if (hasErrors) return;
        }

        let fieldsToValidate: Path<PostAdFormData>[] = [];

        // Validate the fields the backend actually checks (IDs, not display strings).
        switch (currentStep) {
            // Step 1: Device identity — backend requires categoryId (ObjectId) and deviceCondition.
            // 'brand' / 'brandId' are optional on the backend but we gate on brand display name
            // so the user always selects one before proceeding.
            case 1: 
                fieldsToValidate = ["categoryId", "brand", "model", "deviceCondition"] as Path<PostAdFormData>[];
                if (requiresScreenSize) fieldsToValidate.push("screenSize" as Path<PostAdFormData>);
                break;
            // Step 2: Listing details — backend requires title, description, price and a fully
            // populated location object (locationId + city + state + coordinates).
            case 2: fieldsToValidate = ["title", "description", "price", "location"] as Path<PostAdFormData>[]; break;
            default: break;
        }

        const isValid = await trigger(fieldsToValidate);
        if (isValid) {
            if (currentStep < 2) {
                setCurrentStep(prev => prev + 1);
                document.querySelector("[data-post-ad-scroll]")?.scrollTo({ top: 0, behavior: "smooth" });
            }
        } else {
            requestAnimationFrame(() => {
                const firstError = document.querySelector(".text-destructive");
                if (firstError) {
                    firstError.scrollIntoView({ behavior: "smooth", block: "center" });
                }
            });
        }
    }, [currentStep, form, requiresScreenSize, trigger]);

    const prevStep = useCallback(() => {
        if (currentStep > 1) {
            setCurrentStep(prev => prev - 1);
            document.querySelector("[data-post-ad-scroll]")?.scrollTo({ top: 0, behavior: "smooth" });
        }
    }, [currentStep]);

    // Stable reference: handleSubmit from RHF is stable; onValidSubmit is useCallback-wrapped.
    // Without useCallback here, a new fn is created each render and ends up in the useMemo deps
    const { submitAd, isInternalUploading } = useImageUploadWorkflow(
        form, listingImages, setListingImages,
        normalizeIdentityFieldsBeforeSubmit, onValidSubmit,
        setFormError, setSubmittedAd
    );

    // Destructure stable function refs from images hook
    const { addImages, removeImage } = imagesHook;

    const stateValue = useMemo<PostAdStateContextType>(() => ({
        currentStep,
        stepValidationAttempts,
        form,
        control,
        errors,
        brandIsPending,
        spareParts,
        listingImages,
        listingLocation,
        locationDisplay: locationDisplay || "",
        coordinates,
        dynamicCategories,
        categoryMap,
        availableBrands,
        availableModels,
        availableSizes,
        availableSpareParts,
        isLoadingSpareParts,
        categorySchema,
        isLoading,
        isUploadingImages: imagesHook.isUploadingImages,
        isSubmitting: isSubmitting || isInternalUploading,
        isEditMode,
        isLocationLocked,
        userHasInteracted,
        loadError,
        formError,
        imageUploadError: imagesHook.imageUploadError,
        requiresScreenSize,
        submittedAd,
        sparePartsError,
        brandsError,
    }), [
        form,
        control,
        errors,
        currentStep,
        stepValidationAttempts,
        brandIsPending,
        spareParts,
        listingImages,
        listingLocation,
        locationDisplay,
        coordinates,
        dynamicCategories,
        categoryMap,
        availableBrands,
        availableModels,
        availableSizes,
        availableSpareParts,
        isLoadingSpareParts,
        categorySchema,
        isLoading,
        imagesHook.isUploadingImages,
        isSubmitting,
        isInternalUploading, // Added to dependencies
        isEditMode,
        isLocationLocked,
        userHasInteracted,
        loadError,
        formError,
        imagesHook.imageUploadError,
        requiresScreenSize,
        submittedAd,
        sparePartsError,
        brandsError,
    ]);

    const actionValue = useMemo<PostAdActionContextType>(() => ({
        setCurrentStep,
        nextStep,
        prevStep,
        handleCategoryChange,
        handleBrandChange,
        toggleSparePart,
        toggleAllSpareParts,
        addImages,
        removeImage,
        setLocation: setLocation as (display: string, coords?: GeoJSONPoint | undefined, meta?: { city?: string; state?: string; id?: string }) => void,
        loadBrandsForCategory,
        loadModelsForBrand,
        loadSparePartsForCategory,
        loadCategorySchema,
        generateDescription,
        submitAd,
        setUserHasInteracted,
        setLoadError,
        setFormError,
        setImageUploadError: imagesHook.setImageUploadError,
        setSubmittedAd,
        setValue,
        register,
        watch,
    }), [
        setCurrentStep,
        nextStep,
        prevStep,
        handleCategoryChange,
        handleBrandChange,
        toggleSparePart,
        toggleAllSpareParts,
        addImages,
        removeImage,
        setLocation,
        loadBrandsForCategory,
        loadModelsForBrand,
        loadSparePartsForCategory,
        loadCategorySchema,
        generateDescription,
        submitAd,
        setUserHasInteracted,
        setLoadError,
        setFormError,
        imagesHook.setImageUploadError,
        setSubmittedAd,
        setValue,
        register,
        watch,
    ]);

    return (
        <PostAdStateContext.Provider value={stateValue}>
            <PostAdActionContext.Provider value={actionValue}>
                {children}
            </PostAdActionContext.Provider>
        </PostAdStateContext.Provider>
    );
}

export const usePostAdState = () => {
    const ctx = useContext(PostAdStateContext);
    if (!ctx) throw new Error("usePostAdState must be used within PostAdProvider");
    return ctx;
};

export const usePostAdAction = () => {
    const ctx = useContext(PostAdActionContext);
    if (!ctx) throw new Error("usePostAdAction must be used within PostAdProvider");
    return ctx;
};

// Backwards compatibility layer
export const usePostAd = (): PostAdContextType => {
    const state = usePostAdState();
    const actions = usePostAdAction();
    return { ...state, ...actions };
};
