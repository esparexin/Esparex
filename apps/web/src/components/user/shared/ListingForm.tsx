"use client";

import React from "react";
import { useForm, useWatch, type FieldValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Field } from "@esparex/ui";
import { MultiBrandSearchSelect } from "@/components/user/shared/MultiBrandSearchSelect";
import { CatalogSelectDropdown } from "@/components/user/shared/CatalogSelectDropdown";
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

    const form = useForm<FieldValues>({
        resolver: zodResolver(config.schema),
        mode: "onBlur",
        reValidateMode: "onChange",
        shouldFocusError: true,
        defaultValues: config.defaultValues,
    });

    const { register, control, setValue, setError, clearErrors, formState: { errors } } = form;

    const categoryId = useWatch({ control, name: "categoryId" }) || "";
    const brandId = useWatch({ control, name: "brandId" }) || "";
    const [selectedBrandIds, setSelectedBrandIds] = React.useState<string[]>(() => (brandId ? [brandId] : []));
    const [prevBrandId, setPrevBrandId] = React.useState(brandId);

    if (brandId !== prevBrandId) {
        setPrevBrandId(brandId);
        if (brandId && !selectedBrandIds.includes(brandId)) {
            setSelectedBrandIds((prev) => (prev.length === 0 ? [brandId] : prev));
        }
    }

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

    const handleRemoveImage = React.useCallback((idOrIndex: string | number) => {
        if (typeof idOrIndex === 'number') {
            removeImage(idOrIndex);
            return;
        }
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
        setSelectedBrandIds([]);
        setValue(config.catalogFieldName, config.catalogMultiSelect ? [] : "", { shouldValidate: true, shouldDirty: true });
        void loadBrandsForCategory(selectedCategoryId);
        void loadCatalogItems(selectedCategoryId);
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

    const catalogError = getFirstFormErrorMessage(errors[config.catalogFieldName]);

    return (
        <GenericPostForm
            {...sharedProps}
            title={isEditMode ? `Edit ${config.entityLabel}` : `Post ${config.entityLabel}`}
            formId={config.formId}
            priceSlot={categoryId ? <ListingPriceField name="price" /> : null}
        >
            {isEditMode && (
                <div className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                    Category, brand, and type are locked for active listings. Update title, description, price, or photos below.
                </div>
            )}

            <Field label="Category" labelClassName="text-caption sm:text-small font-medium text-foreground-secondary" error={getFirstFormErrorMessage(errors.categoryId)}>
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
                    label={config.catalogLabel}
                    labelClassName="text-caption sm:text-small font-medium text-foreground-secondary"
                    error={catalogError}
                >
                    {availableItems.length === 0 ? (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-caption text-amber-800">
                            {config.catalogEmptyErrorMessage}
                        </div>
                    ) : (
                        <CatalogSelectDropdown
                            items={availableItems}
                            value={catalogValue || (config.catalogMultiSelect ? [] : "")}
                            onChange={(val) => setValue(config.catalogFieldName, val, { shouldValidate: true, shouldDirty: true })}
                            multiSelect={config.catalogMultiSelect}
                            placeholder={`Select ${config.catalogLabel}...`}
                            disabled={isEditMode}
                            error={catalogError}
                        />
                    )}
                </Field>
            )}

            {categoryId && (
                <Field label="Compatible Brand(s) (Optional)" labelClassName="text-caption sm:text-small font-medium text-foreground-secondary" error={getFirstFormErrorMessage(errors.brandId)}>
                    <MultiBrandSearchSelect
                        brands={availableBrands}
                        brandMap={brandMap}
                        values={selectedBrandIds}
                        onChange={(selectedIds) => {
                            setSelectedBrandIds(selectedIds);
                            setValue("brandId", selectedIds[0] || "", { shouldValidate: true, shouldDirty: true });
                        }}
                        disabled={isEditMode}
                    />
                </Field>
            )}

            {categoryId && (
                <ListingTitleField
                    label={config.titleProps.label}
                    error={getFirstFormErrorMessage(errors.title)}
                    registerProps={register("title")}
                    placeholder={config.titleProps.placeholder}
                    valueLength={titleVal.length}
                    maxLength={config.titleProps.maxLength}
                />
            )}

            {categoryId && (
                <ListingDescriptionField
                    label={config.descriptionProps.label || "Description"}
                    error={getFirstFormErrorMessage(errors.description)}
                    registerProps={register("description")}
                    placeholder={config.descriptionProps.placeholder}
                    helperText={config.descriptionProps.helperText}
                    valueLength={descVal.length}
                    maxLength={config.descriptionProps.maxLength}
                />
            )}
        </GenericPostForm>
    );
}
