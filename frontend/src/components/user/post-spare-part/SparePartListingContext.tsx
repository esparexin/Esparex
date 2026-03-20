"use client";

import {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
} from "react";
import { notify } from "@/lib/notify";
import {
    useForm,
    UseFormReturn,
    Control,
    FieldErrors,
    UseFormRegister,
    UseFormWatch,
    UseFormSetValue,
    Resolver,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    SparePartListingPayloadSchema,
    SparePartListingFormData,
} from "@/schemas/sparePartListingPayload.schema";
import { getMyBusiness } from "@/api/user/businesses";
import { createSparePartListing } from "@/api/user/sparePartListings";
import { useNavigation } from "@/context/NavigationContext";
import logger from "@/lib/logger";

// Unified Hooks
import { useListingCatalog } from "@/hooks/listings/useListingCatalog";
import { useListingImages } from "@/hooks/listings/useListingImages";
import { useListingSubmission } from "@/hooks/listings/useListingSubmission";
import { ListingImage, ListingCategory } from "@/types/listing";
import { resolveCanonicalLocationId } from "@/utils/listings/locationUtils";
import { DeviceModel, SparePart } from "@/api/user/masterData";

/* ===================== TYPES ===================== */

export interface SparePartListingContextType {
    currentStep: number;
    totalSteps: number;

    form: UseFormReturn<SparePartListingFormData>;
    register: UseFormRegister<SparePartListingFormData>;
    control: Control<SparePartListingFormData>;
    errors: FieldErrors<SparePartListingFormData>;
    watch: UseFormWatch<SparePartListingFormData>;
    setValue: UseFormSetValue<SparePartListingFormData>;

    nextStep: () => Promise<void>;
    prevStep: () => void;

    // Catalog lists
    categories: ListingCategory[];
    brands: string[];
    models: DeviceModel[];
    spareParts: SparePart[];

    // Handlers
    handleCategoryChange: (id: string) => Promise<void>;
    handleBrandChange: (name: string) => Promise<void>;

    // Compatible models
    selectedCompatibleModels: { id: string; name: string }[];
    toggleCompatibleModel: (model: { id: string; name: string }) => void;

    // Images
    listingImages: ListingImage[];
    addImages: (files: File[]) => void;
    removeImage: (index: number) => void;

    // Business location (pre-filled, read-only)
    businessLocationDisplay: string;

    submitListing: () => Promise<void>;
    isLoading: boolean;
    isSubmitting: boolean;
    formError: string | null;
    setFormError: (message: string | null) => void;
}

const SparePartListingContext = createContext<SparePartListingContextType | undefined>(undefined);

export function SparePartListingProvider({ children }: { children: ReactNode }) {
    const { setIsDirty } = useNavigation();

    const [currentStep, setCurrentStep] = useState(1);
    const [selectedCompatibleModels, setSelectedCompatibleModels] = useState<{ id: string; name: string }[]>([]);

    const [businessLocationDisplay, setBusinessLocationDisplay] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    const form = useForm<SparePartListingFormData>({
        resolver: zodResolver(SparePartListingPayloadSchema) as Resolver<SparePartListingFormData>,
        defaultValues: {
            title: "",
            description: "",
            price: 0,
            images: [],
            compatibleModels: [],
        },
    });

    const { register, control, handleSubmit, watch, setValue, trigger, formState: { errors, isDirty } } = form;

    // Pre-fill location from business
    useEffect(() => {
        const loadBusiness = async () => {
            try {
                setIsLoading(true);
                const business = await getMyBusiness();

                if (business?.location) {
                    const loc = business.location;
                    const display = loc.display || [loc.city, loc.state].filter(Boolean).join(", ");
                    const canonicalId = resolveCanonicalLocationId(business);
                    
                    setBusinessLocationDisplay(display);

                    setValue("location.city", loc.city || "");
                    setValue("location.state", loc.state || "");
                    setValue("location.display", display);
                    if (loc.coordinates) {
                        setValue("location.coordinates", loc.coordinates);
                    }
                    if (canonicalId) {
                        setValue("locationId", canonicalId);
                        setValue("location.locationId", canonicalId);
                    }
                }
            } catch (e) {
                logger.error("[SparePartListing] failed to init:", e);
            } finally {
                setIsLoading(false);
            }
        };
        void loadBusiness();
    }, [setValue]);

    // Unified Hooks Initialization
    const catalogHook = useListingCatalog({ 
        listingType: 'postsparepart', 
        onError: (err) => setFormError(err) 
    });
    const imagesHook = useListingImages({
        onImagesChange: (images) => {
            setValue("images", images.map(i => i.preview), { shouldValidate: true });
        }
    });
    
    const { 
        dynamicCategories: categories, 
        availableBrands: brands, 
        availableModels: models, 
        availableSpareParts: spareParts, 
        loadBrandsForCategory,
        loadModelsForBrand,
        loadSparePartsForCategory 
    } = catalogHook;

    const { listingImages, addImages, removeImage } = imagesHook;

    useEffect(() => {
        setIsDirty(isDirty || listingImages.length > 0);
    }, [isDirty, listingImages.length, setIsDirty]);



    const handleCategoryChange = async (id: string) => {
        await loadBrandsForCategory(id);
        await loadSparePartsForCategory(id);
        setValue("category", id);
        setValue("categoryId", id);
        setValue("brand", "");
        setValue("brandId", "");
        setValue("sparePartId", "");
        setValue("sparePartName", "");
        setSelectedCompatibleModels([]);
        setValue("compatibleModels", []);
    };

    const handleBrandChange = async (name: string) => {
        setValue("brand", name);
        const brandObj = catalogHook.brandMap[name];
        if (brandObj?.id) {
            setValue("brandId", brandObj.id);
            await loadModelsForBrand(brandObj.id, watch("categoryId"));
        } else {
            setValue("brandId", "");
        }
    };

    const toggleCompatibleModel = (model: { id: string; name: string }) => {
        setSelectedCompatibleModels(prev => {
            const exists = prev.some(m => m.id === model.id);
            const updated = exists ? prev.filter(m => m.id !== model.id) : [...prev, model];
            setValue("compatibleModels", updated.map(m => m.id), { shouldValidate: false });
            return updated;
        });
    };

    const nextStep = async () => {
        const step1Fields: (keyof SparePartListingFormData)[] = ["category", "sparePartId"];
        const isValid = await trigger(step1Fields);
        if (isValid) {
            setCurrentStep(prev => prev + 1);
            return;
        }

        const firstInvalid = step1Fields.find(f => form.getFieldState(f).invalid);
        if (firstInvalid) {
            form.setFocus(firstInvalid);
            setFormError(form.getFieldState(firstInvalid).error?.message || "Please fix highlighted fields.");
        } else {
            setFormError("Please fix highlighted fields.");
        }
    };

    const prevStep = () => {
        setFormError(null);
        setCurrentStep(prev => prev - 1);
    };

    const { onValidSubmit, isSubmitting } = useListingSubmission({
        form,
        listingImages,
        isEditMode: false,
        schema: SparePartListingPayloadSchema,
        submitFn: createSparePartListing,
        onSuccess: () => {
            notify.success("Spare part listing submitted for review!");
            window.location.assign("/account/business");
        },
        onError: setFormError
    });

    const submitListing = handleSubmit(onValidSubmit);

    const value: SparePartListingContextType = {
        currentStep,
        totalSteps: 2,
        form,
        register,
        control,
        errors,
        watch,
        setValue,
        nextStep,
        prevStep,
        categories,
        brands,
        models,
        spareParts,
        handleCategoryChange,
        handleBrandChange,
        selectedCompatibleModels,
        toggleCompatibleModel,
        listingImages,
        addImages,
        removeImage,
        businessLocationDisplay,
        submitListing,
        isLoading,
        isSubmitting,
        formError,
        setFormError,
    };

    return (
        <SparePartListingContext.Provider value={value}>
            {children}
        </SparePartListingContext.Provider>
    );
}

export const useSparePartListing = () => {
    const context = useContext(SparePartListingContext);
    if (!context) throw new Error("useSparePartListing must be used within SparePartListingProvider");
    return context;
};
