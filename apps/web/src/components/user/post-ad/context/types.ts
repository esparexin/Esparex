"use client";

import type { SparePart, DeviceModel, Brand } from "@/lib/api/user/masterData";
import type { UseFormReturn, Control, FieldErrors, UseFormRegister, UseFormWatch, UseFormSetValue } from "react-hook-form";
import type { AdPayload as PostAdFormData } from "@/schemas/adPayload.schema";
import type { CategoryFilter } from "@shared";
import type { Listing } from "@/lib/api/user/listings/normalizer";
import type { GeoJSONPoint } from "@/types/location";
import type { ListingImage, ListingCategory, ListingLocation } from "@/types/listing";

export interface PostAdContextType {
    currentStep: number;
    setCurrentStep: (step: number) => void;
    stepValidationAttempts: Record<number, boolean>;
    form: UseFormReturn<PostAdFormData>;
    register: UseFormRegister<PostAdFormData>;
    control: Control<PostAdFormData>;
    errors: FieldErrors<PostAdFormData>;
    watch: UseFormWatch<PostAdFormData>;
    setValue: UseFormSetValue<PostAdFormData>;
    nextStep: () => Promise<void>;
    prevStep: () => void;
    handleCategoryChange: (id: string) => Promise<void>;
    handleBrandChange: (name: string, requestId?: string) => Promise<void>;
    brandIsPending: boolean;
    toggleSparePart: (partId: string) => void;
    toggleAllSpareParts: (selectAll: boolean) => void;
    listingImages: ListingImage[];
    addImages: (files: File[]) => void;
    removeImage: (index: number) => void;
    listingLocation: ListingLocation | null;
    locationDisplay: string;
    coordinates: GeoJSONPoint | null | undefined;
    setLocation: (display: string, coords: GeoJSONPoint | null | undefined, meta?: { city?: string; state?: string; id?: string }) => void;
    dynamicCategories: ListingCategory[];
    categoryMap: Record<string, ListingCategory>;
    availableBrands: string[];
    brandMap: Record<string, Brand>;
    availableModels: DeviceModel[];
    availableSizes: string[];
    availableSpareParts: SparePart[];
    isLoadingSpareParts: boolean;
    categorySchema: { categoryId: string; categoryName: string; filters: CategoryFilter[] } | null;
    requiresScreenSize: boolean;
    loadBrandsForCategory: (categoryId: string) => Promise<void>;
    loadModelsForBrand: (brandId?: string, categoryId?: string, search?: string) => Promise<void>;
    loadSparePartsForCategory: (categoryId: string) => Promise<void>;
    loadCategorySchema: (categoryId: string) => Promise<void>;
    refreshBrands: () => Promise<void>;
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
    mode: 'create' | 'edit';
    listingId?: string;
    initializeFromListing: (data: Listing) => void;
    resetToCreateMode: () => void;
}

export type PostAdStateContextType = Omit<PostAdContextType, "setCurrentStep" | "nextStep" | "prevStep" | "handleCategoryChange" | "handleBrandChange" | "toggleSparePart" | "toggleAllSpareParts" | "addImages" | "removeImage" | "setLocation" | "loadBrandsForCategory" | "loadModelsForBrand" | "loadSparePartsForCategory" | "loadCategorySchema" | "refreshBrands" | "generateDescription" | "submitAd" | "setUserHasInteracted" | "setLoadError" | "setFormError" | "setImageUploadError" | "setSubmittedAd" | "setValue" | "register" | "watch" | "initializeFromListing" | "resetToCreateMode">;

export type PostAdActionContextType = Pick<PostAdContextType, "setCurrentStep" | "nextStep" | "prevStep" | "handleCategoryChange" | "handleBrandChange" | "toggleSparePart" | "toggleAllSpareParts" | "addImages" | "removeImage" | "setLocation" | "loadBrandsForCategory" | "loadModelsForBrand" | "loadSparePartsForCategory" | "loadCategorySchema" | "refreshBrands" | "generateDescription" | "submitAd" | "setUserHasInteracted" | "setLoadError" | "setFormError" | "setImageUploadError" | "setSubmittedAd" | "setValue" | "register" | "watch" | "initializeFromListing" | "resetToCreateMode">;

export type PostAdCatalogState = {
    dynamicCategories: ListingCategory[];
    categoryMap: Record<string, ListingCategory>;
    availableBrands: string[];
    brandMap: Record<string, Brand>;
    availableModels: DeviceModel[];
    availableSizes: string[];
    availableSpareParts: SparePart[];
    isLoadingSpareParts: boolean;
    categorySchema: { categoryId: string; categoryName: string; filters: CategoryFilter[] } | null;
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
    isGeneratingAI: boolean;
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
