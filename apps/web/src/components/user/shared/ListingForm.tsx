"use client";

import React from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Field } from "@/components/ui/field";
import { cn } from "@/components/ui/utils";
import { Check } from "@/icons/IconRegistry";
import { BrandSearchSelect } from "@/components/user/BrandSearchSelect";
import { ListingTitleField, ListingPriceField, ListingDescriptionField, CategorySelectorGrid, getFirstFormErrorMessage } from "@/components/user/shared/ListingFormFields";
import { ListingModalLoading } from "@/components/user/shared/ListingModalLayout";
import { useBrandCatalog } from "@/hooks/listings/useBrandCatalog";
import { useListingCategories } from "@/hooks/listings/useListingCategories";
import { useServiceTypeCatalog } from "@/hooks/listings/useServiceTypeCatalog";
import { useSparePartCatalog } from "@/hooks/listings/useSparePartCatalog";
import { GenericPostForm } from "@/components/user/shared/GenericPostForm";
import { useListingFormProps } from "@/components/user/shared/useListingFormProps";
import { ListingSubmissionSuccessModal } from "@/components/user/shared/ListingSubmissionSuccessModal";
import { useRouter } from "next/navigation";
import { buildAccountListingRoute } from "@/lib/accountListingRoutes";
import { useListingFormOrchestration } from "@/components/user/shared/useListingFormOrchestration";
import type { ListingFormConfig } from "./listingFormConfig";
import { LISTING_TYPE } from "@esparex/contracts";

export function ListingForm({ config, editId }: { config: ListingFormConfig; editId?: string }) {
    const isEditMode = Boolean(editId);
    const router = useRouter();
    const [submitted, setSubmitted] = React.useState(false);

    const form = useForm<any>({
        resolver: zodResolver(config.schema),
        mode: "onBlur",
        reValidateMode: "onChange",
        shouldFocusError: true,
        defaultValues: config.defaultValues,
    });

    const { register, control, setValue, setError, clearErrors, formState: { errors } } = form;

    const categoryId = useWatch({ control, name: "categoryId" }) || "";
    const brandId = useWatch({ control, name: "brandId" }) || "";
    const catalogValue = useWatch({ control, name: config.catalogFieldName });
    const selectedCatalogIds = React.useMemo(() => {
        if (Array.isArray(catalogValue)) return catalogValue;
        return catalogValue ? [catalogValue] : [];
    }, [catalogValue]);

    const titleVal = useWatch({ control, name: "title" }) || "";
    const descVal = useWatch({ control, name: "description" }) || "";

    const { dynamicCategories, categoryMap } = useListingCategories({ listingType: config.listingType });
    const { availableBrands, brandMap, loadBrandsForCategory } = useBrandCatalog({
        categoryMap,
        includeScreenSizes: false,
    });

    const isService = config.listingType === LISTING_TYPE.SERVICE;
    const serviceCatalog = useServiceTypeCatalog();
    const sparePartCatalog = useSparePartCatalog({ listingType: LISTING_TYPE.SPARE_PART });

    const availableItems = isService
        ? serviceCatalog.availableServiceTypes
        : sparePartCatalog.availableSpareParts;

    const isLoadingItems = isService
        ? serviceCatalog.isLoadingServiceTypes
        : sparePartCatalog.isLoadingSpareParts;

    const loadCatalogItems = React.useCallback(async (catId: string) => {
        if (isService) {
            return serviceCatalog.loadServiceTypes(catId);
        } else {
            return sparePartCatalog.loadSparePartsForCategory(catId);
        }
    }, [isService, serviceCatalog, sparePartCatalog]);

    const { images, addImages, removeImage, isFetchingData, businessData, onValidSubmit, isSubmitting } = useListingFormOrchestration({
        config,
        form,
        editId,
        loadBrandsForCategory,
        loadCatalogItems,
        onSubmitted: () => setSubmitted(true),
    });

    const handleRemoveImage = React.useCallback((idOrIndex: string) => {
        const indexById = images.findIndex((img) => img.id === idOrIndex);
        if (indexById >= 0) {
            removeImage(indexById);
        } else {
            const parsedIndex = parseInt(idOrIndex, 10);
            if (!isNaN(parsedIndex)) {
                removeImage(parsedIndex);
            }
        }
    }, [images, removeImage]);

    React.useEffect(() => {
        if (!categoryId) {
            clearErrors(config.catalogFieldName);
            return;
        }
        if (isLoadingItems) return;
        if (availableItems.length === 0) {
            if (selectedCatalogIds.length > 0) {
                clearErrors(config.catalogFieldName);
                return;
            }
            setError(config.catalogFieldName, {
                type: "manual",
                message: config.catalogEmptyErrorMessage,
            });
        } else {
            clearErrors(config.catalogFieldName);
        }
    }, [categoryId, availableItems.length, isLoadingItems, selectedCatalogIds.length, setError, clearErrors, config.catalogFieldName, config.catalogEmptyErrorMessage]);

    const handleCategorySelect = (selectedCategoryId: string) => {
        setValue("categoryId", selectedCategoryId, { shouldValidate: true, shouldDirty: true });
        setValue("brandId", "", { shouldValidate: true, shouldDirty: true });
        setValue(config.catalogFieldName, config.catalogMultiSelect ? [] : "", { shouldValidate: true, shouldDirty: true });
        void loadBrandsForCategory(selectedCategoryId);
        void loadCatalogItems(selectedCategoryId);
    };

    const handleCatalogToggle = (itemId: string) => {
        if (config.catalogMultiSelect) {
            const current = Array.isArray(catalogValue) ? catalogValue : [];
            const next = current.includes(itemId)
                ? current.filter((id: string) => id !== itemId)
                : [...current, itemId];
            setValue(config.catalogFieldName, next, { shouldValidate: true, shouldDirty: true });
        } else {
            setValue(config.catalogFieldName, itemId, { shouldValidate: true, shouldDirty: true });
        }
    };

    const sharedProps = useListingFormProps({
        form,
        images,
        onImageUpload: addImages,
        onImageRemove: handleRemoveImage,
        isEditMode,
        isSubmitting,
        onValidSubmit,
        businessData,
    });

    if (submitted) {
        return (
            <div className="flex items-center justify-center p-4">
                <ListingSubmissionSuccessModal
                    entityLabel={config.entityLabel}
                    isEditMode={isEditMode}
                    pendingActionLabel={`View Pending ${config.entityLabel}s`}
                    onPrimaryAction={() => void router.push("/")}
                    onSecondaryAction={() => void router.push(buildAccountListingRoute(config.pendingSection, "pending"))}
                />
            </div>
        );
    }

    if (isFetchingData) {
        return <ListingModalLoading />;
    }

    const catalogError = getFirstFormErrorMessage(errors[config.catalogFieldName] as any);

    return (
        <GenericPostForm
            {...sharedProps}
            title={isEditMode ? `Edit ${config.entityLabel}` : `Post ${config.entityLabel}`}
            formId={config.formId}
        >
            {isEditMode && (
                <div className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                    Category, brand, and type are locked for active listings. Update title, description, price, or photos below.
                </div>
            )}

            <Field label="1. Select Category" labelClassName="text-sm font-medium" error={getFirstFormErrorMessage(errors.categoryId as any)}>
                <CategorySelectorGrid
                    categories={dynamicCategories}
                    selectedCategoryId={categoryId}
                    onSelect={handleCategorySelect}
                    disabled={isEditMode}
                    defaultIcon={config.icon}
                />
            </Field>

            {categoryId && (
                <Field
                    label={`2. Select ${config.catalogLabel}`}
                    labelClassName="text-sm font-medium"
                    error={catalogError}
                >
                    <p className="mb-2 text-xs text-slate-500">
                        {config.catalogMultiSelect ? "Choose all that apply" : "Select one option"}
                    </p>
                    {availableItems.length === 0 ? (
                        <div className="rounded border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                            {config.catalogEmptyErrorMessage}
                        </div>
                    ) : (
                        <div className={cn("grid gap-2.5 sm:gap-3", config.catalogGridCols)}>
                            {availableItems.map((item) => {
                                const isSelected = selectedCatalogIds.includes(item.id || (item._id as string));
                                return (
                                    <button
                                        key={item.id || item._id}
                                        type="button"
                                        disabled={isEditMode}
                                        onClick={() => handleCatalogToggle(item.id || (item._id as string))}
                                        className={cn(
                                            "flex items-center gap-2.5 rounded hover:border-blue-400 p-2.5 text-left text-xs transition-all border sm:text-sm",
                                            isSelected
                                                ? "border-blue-600 bg-blue-50/50 font-medium text-blue-900 shadow-sm"
                                                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                                            isEditMode && "cursor-not-allowed opacity-60"
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                "flex h-4 w-4 shrink-0 items-center justify-center border transition-colors",
                                                config.catalogMultiSelect ? "rounded" : "rounded-full",
                                                isSelected
                                                    ? "border-blue-600 bg-blue-600 text-white"
                                                    : "border-slate-300 bg-white"
                                            )}
                                        >
                                            {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                                        </div>
                                        <span className="line-clamp-2 leading-tight">{item.name}</span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </Field>
            )}

            {categoryId && (
                <Field label="3. Brand / Manufacturer (Optional)" labelClassName="text-sm font-medium" error={getFirstFormErrorMessage(errors.brandId as any)}>
                    <BrandSearchSelect
                        brands={availableBrands}
                        brandMap={brandMap}
                        categoryId={categoryId}
                        value={brandId}
                        onChange={(bId) => setValue("brandId", bId, { shouldValidate: true, shouldDirty: true })}
                        disabled={isEditMode}
                    />
                </Field>
            )}

            {categoryId && (
                <ListingTitleField
                    label={config.titleProps.label}
                    error={getFirstFormErrorMessage(errors.title as any)}
                    registerProps={register("title")}
                    placeholder={config.titleProps.placeholder}
                    valueLength={titleVal.length}
                    maxLength={config.titleProps.maxLength}
                />
            )}

            {categoryId && (
                <ListingPriceField name="price" />
            )}

            {categoryId && (
                <ListingDescriptionField
                    label={config.descriptionProps.label || "Description"}
                    error={getFirstFormErrorMessage(errors.description as any)}
                    registerProps={register("description")}
                    placeholder={config.descriptionProps.placeholder}
                    valueLength={descVal.length}
                    maxLength={config.descriptionProps.maxLength}
                />
            )}
        </GenericPostForm>
    );
}
