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
import { notify } from "@/lib/notify";
import logger from "@/lib/logger";
import { generateAIContent } from "@/lib/api/user/ai";
import type { SparePart } from "@/lib/api/user/masterData";
import { suppressGoogleMapsRetryErrors } from "@/lib/suppress-google-maps-errors";
import { normalizeOptionalObjectId } from "@/lib/normalizeOptionalObjectId";
import { sanitizeMongoObjectId } from "@/lib/listings/locationUtils";

// FORM imports
import { useNavigation } from "@/context/NavigationContext";
import { UseFormReturn, Control, FieldErrors, UseFormRegister, UseFormWatch, UseFormSetValue } from "react-hook-form";
import { AdPayload as PostAdFormData } from "@/schemas/adPayload.schema";
import { CategoryFilter } from "@shared/schemas/catalog.schema";

// Custom hooks
import { useListingCatalog } from "@/hooks/listings/useListingCatalog";
import { useListingImages } from "@/hooks/listings/useListingImages";
import { useListingLocation } from "@/hooks/listings/useListingLocation";
import { useListingSubmission } from "@/hooks/listings/useListingSubmission";
import { usePostAdPreload } from "@/hooks/usePostAdPreload";
import { usePostAdForm } from "@/hooks/usePostAdForm";
import { usePostAdValidation } from "@/hooks/usePostAdValidation";
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
    coordinates: any;
    setLocation: (
        display: string,
        coords?: any,
        meta?: { city?: string; state?: string; id?: string }
    ) => void;

    // Catalog Data
    dynamicCategories: ListingCategory[];
    categoryMap: Record<string, ListingCategory>;
    availableBrands: string[];
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

    submittedAd: any | null;
    setSubmittedAd: (ad: any | null) => void;
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
    const { form, register, control, errors, watch, setValue, trigger, handleSubmit } = formHook;
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
            setValue("location", location as any, { 
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
    const [submittedAd, setSubmittedAd] = useState<any | null>(null);

    // Derived state from images hook
    const { listingImages, setListingImages } = imagesHook;

    // Destructure location hook
    const { listingLocation, setLocation, coordinates, locationDisplay } = locationHook;

    // Destructure catalog hook
    const { 
        dynamicCategories, 
        categoryMap, 
        availableBrands, 
        availableSizes, 
        availableSpareParts, 
        isLoadingSpareParts, 
        categorySchema, 
        loadBrandsForCategory, 
        loadSparePartsForCategory, 
        loadCategorySchema,
        sparePartsError,
        brandsError
    } = catalogHook;

    // Reactive category value — calling watch() inside useMemo is not reactive
    // (watch reference is stable). Subscribe at render scope instead.
    const selectedCategoryId = String(watch("categoryId") || watch("category") || "");
    const requiresScreenSize = useMemo(() => {
        const category = categoryMap[selectedCategoryId];
        if (!category) return false;
        const name = category.name?.toLowerCase() || "";
        const slug = category.slug?.toLowerCase() || "";
        return Boolean(category.hasScreenSizes) ||
               slug.includes("tv") ||
               slug.includes("monitor") ||
               name.includes("tv") ||
               name.includes("monitor");
    }, [selectedCategoryId, categoryMap]);

    // Destructure validation hook
    const { loadError, setLoadError, formError, setFormError } = validationHook;

    // Submission logic in dedicated hook
    const { setIsDirty } = useNavigation();

    const buildEditAdPayload = useCallback((payload: any) => {
        const editPayload: Record<string, unknown> = {
            title: payload.title,
            description: payload.description,
            price: payload.price,
            images: payload.images,
            isFree: payload.isFree,
        };

        if (!isLocationLocked && payload.location) {
            editPayload.location = payload.location;
        }

        return editPayload;
    }, [isLocationLocked]);

    const normalizeIdentityFieldsBeforeSubmit = useCallback(() => {
        const rawCategoryId = form.getValues("categoryId");
        const rawCategory = form.getValues("category");
        const normalizedCategoryId =
            sanitizeMongoObjectId(rawCategoryId) ||
            sanitizeMongoObjectId(rawCategory) ||
            "";

        if (String(rawCategoryId || "") !== normalizedCategoryId) {
            setValue("categoryId", normalizedCategoryId as any, { shouldValidate: false, shouldDirty: false });
        }
        if (String(rawCategory || "") !== normalizedCategoryId) {
            setValue("category", normalizedCategoryId as any, { shouldValidate: false, shouldDirty: false });
        }

        const rawBrandId = form.getValues("brandId");
        const normalizedBrandId = sanitizeMongoObjectId(rawBrandId) || "";
        if (String(rawBrandId || "") !== normalizedBrandId) {
            setValue("brandId", normalizedBrandId as any, { shouldValidate: false, shouldDirty: false });
        }

        const rawSpareParts = form.getValues("spareParts");
        if (Array.isArray(rawSpareParts)) {
            const normalizedSpareParts = rawSpareParts
                .map((partId) => sanitizeMongoObjectId(partId))
                .filter((partId): partId is string => Boolean(partId));
            const hasChanged =
                normalizedSpareParts.length !== rawSpareParts.length ||
                normalizedSpareParts.some((partId, index) => partId !== rawSpareParts[index]);

            if (hasChanged) {
                setSpareParts(normalizedSpareParts);
                setValue("spareParts", normalizedSpareParts as any, { shouldValidate: false, shouldDirty: false });
            }
        }
    }, [form, setValue]);

    const submitAdApiCall = useCallback((payload: any, options?: { idempotencyKey?: string }) => {
        return (isEditMode && editAdId) 
            ? updateListing(editAdId, buildEditAdPayload(payload))
            : createListing(payload, options);
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
        setValue("spareParts", fieldValue as any, { 
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

    /* ---------- HANDLERS ---------- */
    const handleCategoryChange = useCallback(async (id: string) => {
        setFormError(null);
        setValue("category", id, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
        setValue("categoryId", id, { shouldValidate: true, shouldDirty: true, shouldTouch: true });

        // Reset dependent fields with validation
        setValue("brand", "", { shouldValidate: true, shouldDirty: true });
        setValue("brandId", "", { shouldValidate: true, shouldDirty: true });
        setValue("screenSize", "", { shouldValidate: true, shouldDirty: true });
        setSpareParts([]);
        setValue("spareParts", [], { shouldValidate: true, shouldDirty: true });
        setBrandIsPending(false);
        await loadBrandsForCategory(id);
        await loadSparePartsForCategory(id);
        await loadCategorySchema(id);
    }, [setValue, loadBrandsForCategory, loadSparePartsForCategory, loadCategorySchema]);

    const handleBrandChange = useCallback(async (name: string) => {
        setFormError(null);
        setValue("brand", name, { shouldValidate: true, shouldDirty: true, shouldTouch: true });

        // Resolve Brand ID from Map
        const brandObj = catalogHook.brandMap[name];
        const brandId = normalizeOptionalObjectId(brandObj?.id);
        setValue("brandId", brandId ?? "", { shouldValidate: true, shouldDirty: true, shouldTouch: true });

        // Reset dependent fields with validation
        setSpareParts([]);
        setValue("spareParts", [], { shouldValidate: true, shouldDirty: true });
        setBrandIsPending(false);
    }, [setValue, catalogHook.brandMap]);



    /* ---------- SPARE PARTS ---------- */
    const generateDescription = useCallback(async (targetField: 'title' | 'description') => {
        const { brand, screenSize, category, categoryId } = form.getValues();
        const selectedCategoryId = String(categoryId || category || "");
        const categoryName = categoryMap[selectedCategoryId]?.name || "device";
        const resolvedBrand = String(brand || "").trim() || categoryName;
        const resolvedDescriptor = String(screenSize || "").trim() || categoryName;
        if (!resolvedBrand || !resolvedDescriptor) return;
        setIsLoading(true);
        try {
            const output = await generateAIContent({
                type: 'generate',
                context: {
                    brand: resolvedBrand,
                    model: resolvedDescriptor,
                    condition: "device",
                    targetField
                }
            });
            if (output) {
                if (targetField === 'title' && output.title) {
                    setValue("title", output.title, { shouldValidate: true });
                    trigger("title");
                    notify.success("Title generated successfully!");
                }
                if (targetField === 'description' && output.description) {
                    setValue("description", output.description, { shouldValidate: true });
                    trigger("description");
                    notify.success("Description generated successfully!");
                }
            }
        } catch {
            setFormError(`AI generation failed. Please enter ${targetField} manually.`);
        } finally {
            setIsLoading(false);
        }
    }, [categoryMap, form, setValue, trigger]);


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
                form.setError("categoryId" as any, { type: "manual", message: "Please select a category" });
                hasErrors = true;
            }
            if (!dc) {
                form.setError("deviceCondition" as any, { type: "manual", message: "Please select device condition" });
                hasErrors = true;
            }
            if (hasErrors) return;
        }

        let fieldsToValidate: any[] = [];

        // Validate the fields the backend actually checks (IDs, not display strings).
        switch (currentStep) {
            // Step 1: Device identity — backend requires categoryId (ObjectId) and deviceCondition.
            // 'brand' / 'brandId' are optional on the backend but we gate on brand display name
            // so the user always selects one before proceeding.
            case 1: 
                fieldsToValidate = ["categoryId", "brand", "deviceCondition"];
                if (requiresScreenSize) fieldsToValidate.push("screenSize");
                break;
            // Step 2: Listing details — backend requires title, description, price and a fully
            // populated location object (locationId + city + state + coordinates).
            case 2: fieldsToValidate = ["title", "description", "price", "location"]; break;
            default: break;
        }

        const isValid = await trigger(fieldsToValidate as any);
        if (isValid) {
            if (currentStep < 2) {
                setCurrentStep(prev => prev + 1);
                document.querySelector("[data-post-ad-scroll]")?.scrollTo({ top: 0, behavior: "smooth" });
            }
        }
    }, [currentStep, form, trigger]);

    const prevStep = useCallback(() => {
        if (currentStep > 1) {
            setCurrentStep(prev => prev - 1);
            document.querySelector("[data-post-ad-scroll]")?.scrollTo({ top: 0, behavior: "smooth" });
        }
    }, [currentStep]);

    // Stable reference: handleSubmit from RHF is stable; onValidSubmit is useCallback-wrapped.
    // Without useCallback here, a new fn is created each render and ends up in the useMemo deps
    const [isInternalUploading, setIsInternalUploading] = useState(false);

    const submitAd = useCallback(
        async () => {
            normalizeIdentityFieldsBeforeSubmit();
            return handleSubmit(async (data: PostAdFormData) => {
                setIsInternalUploading(true);
                try {
                    // 1. Identify and Upload Local Images to S3 first
                    // This prevents large base64 payloads and UI hangs.
                    const updatedImages = [...listingImages];
                    const uploadPromises = updatedImages.map(async (img, idx) => {
                        if (img.isRemote || !img.file) return;

                        const formData = new FormData();
                        formData.append("image", img.file);
                        formData.append("folder", "ads");

                        try {
                            const response = await fetch("/api/upload/ad-image", {
                                method: "POST",
                                body: formData,
                                credentials: "include",
                            });
                            const payload = await response.json().catch(() => ({} as { success?: boolean; url?: string; error?: string }));
                            const remoteUrl = typeof payload?.url === "string" ? payload.url : "";

                            if (!response.ok || !remoteUrl) {
                                throw new Error(payload?.error || "Image upload failed. Please try again.");
                            }

                            if (payload.success) {
                                updatedImages[idx] = {
                                    ...img,
                                    preview: remoteUrl,
                                    isRemote: true
                                };
                            }
                        } catch (uploadErr) {
                            logger.error("[PostAdSubmit] Image upload failed:", uploadErr);
                            throw new Error(`Failed to upload image ${idx + 1}. Please try again.`);
                        }
                    });

                    await Promise.all(uploadPromises);

                    // Update local state so it matches the remote reality
                    setListingImages(updatedImages);

                    // 2. Proceed with Final Submission (now contains only remote URLs)
                    const ad = await onValidSubmit(data);
                    if (ad) {
                        setSubmittedAd(ad);
                    }
                } catch (err: any) {
                    logger.error("[PostAdSubmit] Overall submission failed:", err);
                    setFormError(err.message || "Submission failed. Please try again.");
                    notify.error(err.message || "Failed to post ad.");
                } finally {
                    setIsInternalUploading(false);
                }
            }, (errors) => {
                logger.error("[PostAdSubmit] Form validation errors:", errors);
                const firstErrorKey = Object.keys(errors)[0];
                if (typeof document !== "undefined" && firstErrorKey) {
                    if (firstErrorKey === "images") {
                        document.querySelector("input[type='file']")?.scrollIntoView({ behavior: "smooth", block: "center" });
                    } else {
                        document.querySelector(`[name='${firstErrorKey}']`)?.scrollIntoView({ behavior: "smooth", block: "center" });
                    }
                }
            })();
        },
        [handleSubmit, listingImages, normalizeIdentityFieldsBeforeSubmit, onValidSubmit, setSubmittedAd, setListingImages]
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
        setLocation,
        loadBrandsForCategory,
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
