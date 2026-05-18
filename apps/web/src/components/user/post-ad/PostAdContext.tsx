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
import type { SparePart, DeviceModel, Brand } from "@/lib/api/user/masterData";
import { suppressGoogleMapsRetryErrors } from "@/lib/suppress-google-maps-errors";
import { normalizeOptionalObjectId } from "@/lib/normalizeOptionalObjectId";
// FORM imports
import { useNavigation } from "@/context/NavigationContext";
import { UseFormReturn, Control, FieldErrors, UseFormRegister, UseFormWatch, UseFormSetValue } from "react-hook-form";
import { AdPayload as PostAdFormData } from "@/schemas/adPayload.schema";
import { CategoryFilter } from "@shared";
import { Listing } from "@/lib/api/user/listings/normalizer";
import { GeoJSONPoint } from "@/types/location";
import { LISTING_TYPE } from "@shared/enums/listingType";

// Custom hooks
import { useBrandCatalog } from "@/hooks/listings/useBrandCatalog";
import { useCategorySchemaCatalog } from "@/hooks/listings/useCategorySchemaCatalog";
import { useListingCategories } from "@/hooks/listings/useListingCategories";
import { useListingImages } from "@/hooks/listings/useListingImages";
import { useListingLocation } from "@/hooks/listings/useListingLocation";
import { useSparePartCatalog } from "@/hooks/listings/useSparePartCatalog";

import { usePostAdForm } from "@/hooks/usePostAdForm";
import { usePostAdValidation } from "@/hooks/usePostAdValidation";
import { usePostAdAiGeneration } from "./hooks/usePostAdAiGeneration";
import { useCategoryDependents } from "./hooks/useCategoryDependents";
import { usePostAdStepNavigation } from "./hooks/usePostAdStepNavigation";
import { usePostAdSparePartSelection } from "./hooks/usePostAdSparePartSelection";
import { usePostAdSubmissionFlow } from "./hooks/usePostAdSubmissionFlow";
import {
    ListingImage,
    ListingCategory,
    ListingLocation
} from "@/types/listing";

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
    handleBrandChange: (name: string, requestId?: string) => Promise<void>;

    brandIsPending: boolean;

    // Spare Parts
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
        coords: GeoJSONPoint | null | undefined,
        meta?: { city?: string; state?: string; id?: string }
    ) => void;

    // Catalog Data
    dynamicCategories: ListingCategory[];
    categoryMap: Record<string, ListingCategory>;
    availableBrands: string[];
    brandMap: Record<string, Brand>;
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
    setAvailableModels: (models: DeviceModel[]) => void;

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

    // Explicit Edit Mode Hydration
    mode: 'create' | 'edit';
    listingId?: string;
    initializeFromListing: (data: Listing) => void;
    resetToCreateMode: () => void;
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
    | "setAvailableModels"
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
    | "initializeFromListing"
    | "resetToCreateMode"
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
    | "setAvailableModels"
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
    | "initializeFromListing"
    | "resetToCreateMode"
>;

const PostAdStateContext = createContext<PostAdStateContextType | undefined>(undefined);
const PostAdActionContext = createContext<PostAdActionContextType | undefined>(undefined);

// ── Domain-split state contexts ───────────────────────────────────────────────
// Each covers exactly one concern. Components subscribe only to the domain they
// need — a change in catalog will not re-render location consumers, and vice versa.

export type PostAdCatalogState = {
    dynamicCategories: ListingCategory[];
    categoryMap: Record<string, ListingCategory>;
    availableBrands: string[];
    brandMap: Record<string, Brand>;
    availableModels: DeviceModel[];
    availableSizes: string[];
    availableSpareParts: SparePart[];
    isLoadingSpareParts: boolean;
    categorySchema: { categoryId: string; categoryName: string; filters: CategoryFilter[]; } | null;
    requiresScreenSize: boolean;
    sparePartsError: string | null;
    brandsError: string | null;
    brandIsPending: boolean;
};

export type PostAdLocationState = {
    listingLocation: ListingLocation | null;
    locationDisplay: string;
    coordinates: GeoJSONPoint | null | undefined;
    isLocationLocked: boolean;
};

export type PostAdImagesState = {
    listingImages: ListingImage[];
    isUploadingImages: boolean;
    imageUploadError: string | null;
};

export type PostAdFlowState = {
    currentStep: number;
    stepValidationAttempts: Record<number, boolean>;
    isLoading: boolean;
    isSubmitting: boolean;
    isEditMode: boolean;
    userHasInteracted: boolean;
    loadError: string | null;
    formError: string | null;
    submittedAd: Listing | null;
    form: UseFormReturn<PostAdFormData>;
    control: Control<PostAdFormData>;
    errors: FieldErrors<PostAdFormData>;
    mode: 'create' | 'edit';
    listingId?: string;
};

const PostAdCatalogContext = createContext<PostAdCatalogState | undefined>(undefined);
const PostAdLocationContext = createContext<PostAdLocationState | undefined>(undefined);
const PostAdImagesContext = createContext<PostAdImagesState | undefined>(undefined);
const PostAdFlowContext = createContext<PostAdFlowState | undefined>(undefined);

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

    const categoryCatalog = useListingCategories({
        listingType: LISTING_TYPE.AD,
        onError: validationHook.setFormError,
    });
    const brandCatalog = useBrandCatalog({
        categoryMap: categoryCatalog.categoryMap,
        onError: validationHook.setFormError,
    });
    const sparePartCatalog = useSparePartCatalog({
        listingType: LISTING_TYPE.AD,
        onError: validationHook.setFormError,
    });
    const categorySchemaCatalog = useCategorySchemaCatalog();

    const {
        dynamicCategories,
        categoryMap,
    } = categoryCatalog;
    const {
        brandMap,
        availableBrands,
        availableModels,
        availableSizes,
        loadBrandsForCategory,
        loadModelsForBrand,
        setAvailableModels,
        brandsError,
    } = brandCatalog;
    const {
        availableSpareParts,
        isLoadingSpareParts,
        sparePartsError,
        loadSparePartsForCategory,
    } = sparePartCatalog;
    const {
        categorySchema,
        loadCategorySchema,
    } = categorySchemaCatalog;

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

    // Stable callback — must not be inline or setLocation gets a new ref every render,
    // which re-creates actionValue and re-renders all usePostAdAction consumers.
    const handleLocationChange = useCallback((location: ListingLocation | null) => {
        setValue("location", location as PostAdFormData["location"], {
            shouldValidate: true,
            shouldDirty: true,
        });
    }, [setValue]);

    const locationHook = useListingLocation({ onLocationChange: handleLocationChange });

    // Navigation State for 9-Step Flow
    const isEditMode = !!editAdId;
    const [mode, setMode] = useState<'create' | 'edit'>(isEditMode ? 'edit' : 'create');
    const [listingId, setListingId] = useState<string | undefined>(editAdId);
    const [currentStep, setCurrentStep] = useState(isEditMode ? 2 : 1);

    // Track the original ad status loaded during edit preload
    const [originalAdStatus, setOriginalAdStatus] = useState<string | null>(null);

    // Location is locked once ad reaches pending or live — trust signal, cannot be silently changed
    const isLocationLocked = isEditMode && (originalAdStatus === 'live' || originalAdStatus === 'pending');

    // State for pending states and submission outcomes
    const [isLoading, setIsLoading] = useState(isEditMode);
    const [brandIsPending, setBrandIsPending] = useState(false);
    const [submittedAd, setSubmittedAd] = useState<Listing | null>(null);

    // Derived state from images hook
    const { listingImages, setListingImages } = imagesHook;

    // Destructure location hook
    const { listingLocation, setLocation, coordinates, locationDisplay } = locationHook;

    // Destructure catalog hook
    // Reactive category value — calling watch() inside useMemo is not reactive
    // (watch reference is stable). Subscribe at render scope instead.
    const { loadError, setLoadError, formError, setFormError } = validationHook;

    const { requiresScreenSize, handleCategoryChange, handleBrandChange } = useCategoryDependents(
        form, categoryMap, brandMap,
        setFormError, setBrandIsPending,
        loadBrandsForCategory, loadSparePartsForCategory, loadCategorySchema
    );

    // Submission logic in dedicated hook
    const { setIsDirty } = useNavigation();

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

    // 1. Maintain form valid state for spare parts (Internal cleanup when catalog changes)
    // Guard against the transient empty state during loading — setAvailableSpareParts([])
    // fires before the fetch resolves, which would otherwise wipe all selections.
    useEffect(() => {
        if (isLoadingSpareParts) return;
        if (availableSpareParts.length === 0) return;

        const currentParts = (form.getValues("spareParts") || []) as string[];
        if (currentParts.length === 0) return;

        const validIds = new Set(
            availableSpareParts
                .map((part) => normalizeOptionalObjectId(part.id))
                .filter((partId): partId is string => Boolean(partId))
        );

        const next = currentParts.filter((partId) => validIds.has(partId));
        if (next.length !== currentParts.length) {
            form.setValue("spareParts", next, { shouldDirty: true });
        }
    }, [availableSpareParts, isLoadingSpareParts, form]);

    /* ---------- EDIT MODE PRELOADING DELEGATED TO EditAdWrapper ---------- */

    const initializeFromListing = useCallback(async (data: Listing) => {
        setMode('edit');
        setListingId(String(data.id || (data as any)._id || ""));
        setCurrentStep(2);

        if (setOriginalAdStatus && data.status) {
            setOriginalAdStatus(data.status);
        }

        const categoryId = data.categoryId || data.category;
        setValue("categoryId", categoryId);
        setValue("category", categoryId);
        setValue("brand", typeof data.brandName === "string" ? data.brandName : "");
        setValue("title", data.title || "");
        setValue("description", data.description || "");
        setValue("price", Number(data.price) || 0);
        setValue("screenSize", data.screenSize || "");

        if (categoryId) {
            await Promise.all([
                loadBrandsForCategory(categoryId),
                loadSparePartsForCategory(categoryId),
            ]);
        }

        if (data.location) {
            setValue("location", {
                city: data.location.city,
                state: data.location.state,
                display: data.location.display,
                coordinates: data.location.coordinates,
                locationId: (data.location.locationId as string) || (data.location as any).id || undefined,
            });
        }

        if (Array.isArray(data.images)) {
            const mappedImages: ListingImage[] = data.images.map((url: string) => ({
                id: crypto.randomUUID(),
                preview: url,
                isRemote: true,
            }));
            // Use the stable setter ref — NOT imagesHook (object ref changes on listingImages state update)
            setListingImages(mappedImages);
            setValue("images", mappedImages.map((image) => image.preview));
        }

        setIsLoading(false);
        // ⚠️  DO NOT include imagesHook (the whole object) here — its reference changes
        //     every time listingImages state updates, which would create a new callback ref
        //     every time initializeFromListing sets images, causing EditAdWrapper's useEffect
        //     to re-fire and start an infinite listing-fetch loop.
    }, [setValue, loadBrandsForCategory, loadSparePartsForCategory, setListingImages]);

    const resetToCreateMode = useCallback(() => {
        setMode('create');
        setListingId(undefined);
        setCurrentStep(1);
        form.reset();
        imagesHook.setListingImages([]);
    }, [form, imagesHook]);

    /* ---------- SPARE PARTS ---------- */
    /* ---------- GENERATE AI ---------- */
    const { generateDescription } = usePostAdAiGeneration(form, categoryMap, availableSpareParts, setIsLoading, setFormError);


    const { toggleAllSpareParts, toggleSparePart } = usePostAdSparePartSelection(
        form,
        availableSpareParts
    );

    const { nextStep, prevStep } = usePostAdStepNavigation({
        form,
        currentStep,
        setCurrentStep,
        setStepValidationAttempts,
        requiresScreenSize,
        categoryFilters: categorySchema?.filters ?? [],
        trigger,
    });

    const { submitAd, isSubmitting, isInternalUploading } = usePostAdSubmissionFlow({
        form,
        listingImages,
        setListingImages,
        isEditMode,
        editAdId,
        isLocationLocked,
        setFormError,
        setSubmittedAd,
    });

    // Destructure stable function refs from images hook
    const { addImages, removeImage } = imagesHook;

    // ── 4 isolated domain memos ───────────────────────────────────────────────
    // Each re-evaluates only when its own deps change.
    // Catalog loading never triggers a location re-render, and vice versa.

    const catalogState = useMemo<PostAdCatalogState>(() => ({
        dynamicCategories,
        categoryMap,
        availableBrands,
        brandMap,
        availableModels,
        availableSizes,
        availableSpareParts,
        isLoadingSpareParts,
        categorySchema,
        requiresScreenSize,
        sparePartsError,
        brandsError,
        brandIsPending,
    }), [
        dynamicCategories, categoryMap, availableBrands, brandMap, availableModels, availableSizes,
        availableSpareParts, isLoadingSpareParts, categorySchema, requiresScreenSize,
        sparePartsError, brandsError, brandIsPending,
    ]);

    const locationState = useMemo<PostAdLocationState>(() => ({
        listingLocation,
        locationDisplay: locationDisplay || "",
        coordinates,
        isLocationLocked,
    }), [listingLocation, locationDisplay, coordinates, isLocationLocked]);

    const imagesState = useMemo<PostAdImagesState>(() => ({
        listingImages,
        isUploadingImages: imagesHook.isUploadingImages,
        imageUploadError: imagesHook.imageUploadError,
    }), [listingImages, imagesHook.isUploadingImages, imagesHook.imageUploadError]);

    const flowState = useMemo<PostAdFlowState>(() => ({
        currentStep,
        stepValidationAttempts,
        isLoading,
        isSubmitting: isSubmitting || isInternalUploading,
        isEditMode,
        userHasInteracted,
        loadError,
        formError,
        submittedAd,
        form,
        control,
        errors,
        mode,
        listingId,
    }), [
        currentStep, stepValidationAttempts, isLoading, isSubmitting, isInternalUploading,
        isEditMode, userHasInteracted, loadError, formError, submittedAd,
        form, control, errors, mode, listingId
    ]);

    // Backward-compat: components still on usePostAd() / usePostAdState() get a
    // merged view. This memo only re-runs when one of the 4 domain memos changes.
    const stateValue = useMemo<PostAdStateContextType>(() => ({
        ...flowState,
        ...catalogState,
        ...locationState,
        ...imagesState,
    }), [flowState, catalogState, locationState, imagesState]);

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
        loadModelsForBrand,
        loadSparePartsForCategory,
        loadCategorySchema,
        setAvailableModels,
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
        initializeFromListing,
        resetToCreateMode,
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
        setAvailableModels,
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
        initializeFromListing,
        resetToCreateMode,
    ]);

    return (
        <PostAdCatalogContext.Provider value={catalogState}>
            <PostAdLocationContext.Provider value={locationState}>
                <PostAdImagesContext.Provider value={imagesState}>
                    <PostAdFlowContext.Provider value={flowState}>
                        <PostAdStateContext.Provider value={stateValue}>
                            <PostAdActionContext.Provider value={actionValue}>
                                {children}
                            </PostAdActionContext.Provider>
                        </PostAdStateContext.Provider>
                    </PostAdFlowContext.Provider>
                </PostAdImagesContext.Provider>
            </PostAdLocationContext.Provider>
        </PostAdCatalogContext.Provider>
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

// ── Domain-focused hooks ──────────────────────────────────────────────────────
// Use these instead of usePostAd() when a component only needs one domain.
// The component will only re-render when that domain's state changes.

export const usePostAdCatalog = () => {
    const ctx = useContext(PostAdCatalogContext);
    if (!ctx) throw new Error("usePostAdCatalog must be used within PostAdProvider");
    return ctx;
};

export const usePostAdLocationState = () => {
    const ctx = useContext(PostAdLocationContext);
    if (!ctx) throw new Error("usePostAdLocationState must be used within PostAdProvider");
    return ctx;
};

export const usePostAdImages = () => {
    const ctx = useContext(PostAdImagesContext);
    if (!ctx) throw new Error("usePostAdImages must be used within PostAdProvider");
    return ctx;
};

export const usePostAdFlow = () => {
    const ctx = useContext(PostAdFlowContext);
    if (!ctx) throw new Error("usePostAdFlow must be used within PostAdProvider");
    return ctx;
};

// Backwards compatibility layer
export const usePostAd = (): PostAdContextType => {
    const state = usePostAdState();
    const actions = usePostAdAction();
    return { ...state, ...actions };
};
