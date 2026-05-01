"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    ServiceListingPayloadSchema,
    type ServiceListingFormData,
} from "@/schemas/serviceListingPayload.schema";
import { Field } from "@/components/ui/field";
import { cn } from "@/components/ui/utils";
import { Check, Wrench } from "@/icons/IconRegistry";
import { BrandSearchSelect } from "@/components/user/BrandSearchSelect";
import { ListingTitleField, ListingPriceField, ListingDescriptionField, CategorySelectorGrid, getFirstFormErrorMessage } from "@/components/user/shared/ListingFormFields";
import { ListingModalLoading } from "@/components/user/shared/ListingModalLayout";
import { useBrandCatalog } from "@/hooks/listings/useBrandCatalog";
import { useListingCategories } from "@/hooks/listings/useListingCategories";
import { useServiceTypeCatalog } from "@/hooks/listings/useServiceTypeCatalog";
import { GenericPostForm } from "@/components/user/shared/GenericPostForm";
import { useListingFormProps } from "@/components/user/shared/useListingFormProps";
import { ListingSubmissionSuccessModal } from "@/components/user/shared/ListingSubmissionSuccessModal";
import { useRouter } from "next/navigation";
import { buildAccountListingRoute } from "@/lib/accountListingRoutes";
import { usePostServiceFormOrchestration } from "./hooks/usePostServiceFormOrchestration";
import { LISTING_TYPE } from "@shared/enums/listingType";

export function PostServiceForm({ editServiceId }: { editServiceId?: string }) {
    const isEditMode = !!editServiceId;
    const router = useRouter();
    const [submittedService, setSubmittedService] = React.useState(false);

    const form = useForm<ServiceListingFormData>({
        resolver: zodResolver(ServiceListingPayloadSchema),
        mode: "all",
        shouldFocusError: true,
        defaultValues: {
            title: "",
            categoryId: "",
            brandId: "",
            serviceTypeIds: [],
            price: undefined as unknown as number, // A5: forces user to enter a price
            description: "",
        },
    });

    const { register, watch, setValue, setError, clearErrors, formState: { errors } } = form;

    const categoryId = watch("categoryId");
    const brandId = watch("brandId");
    const selectedServiceTypes = watch("serviceTypeIds") || [];
    const titleVal = watch("title") || "";
    const descVal = watch("description") || "";

    const {
        dynamicCategories,
        categoryMap,
    } = useListingCategories({ listingType: LISTING_TYPE.SERVICE });
    const {
        availableBrands,
        brandMap,
        loadBrandsForCategory,
    } = useBrandCatalog({
        categoryMap,
        includeScreenSizes: false,
    });
    const {
        availableServiceTypes,
        isLoadingServiceTypes,
        loadServiceTypes,
    } = useServiceTypeCatalog();

    const selectedCategory = React.useMemo(
        () => dynamicCategories.find((category) => category.id === categoryId) || null,
        [dynamicCategories, categoryId]
    );

    const { images, setImages, isFetchingData, businessData, onValidSubmit, isSubmitting } = usePostServiceFormOrchestration({
        form,
        editServiceId,
        loadBrandsForCategory,
        loadServiceTypes,
        onSubmitted: () => setSubmittedService(true),
    });

    React.useEffect(() => {
        if (!categoryId) {
            clearErrors("serviceTypeIds");
            return;
        }
        if (isLoadingServiceTypes) return;
        if (availableServiceTypes.length === 0) {
            if (selectedServiceTypes.length > 0) {
                clearErrors("serviceTypeIds");
                return;
            }
            setError("serviceTypeIds", {
                type: "manual",
                message: "No service types are configured for this category yet. Choose another category to continue."
            });
            return;
        }
        clearErrors("serviceTypeIds");
    }, [availableServiceTypes.length, categoryId, clearErrors, isLoadingServiceTypes, selectedServiceTypes.length, setError]);

    const handleCategorySelect = async (id: string) => {
        setValue("categoryId", id, { shouldDirty: true, shouldValidate: true });
        setValue("brandId", "", { shouldDirty: true, shouldValidate: true });
        setValue("serviceTypeIds", [], { shouldDirty: true, shouldValidate: true });
        clearErrors("serviceTypeIds");
        await Promise.all([loadBrandsForCategory(id), loadServiceTypes(id)]);
    };

    const toggleServiceType = (id: string) => {
        const next = selectedServiceTypes.includes(id)
            ? selectedServiceTypes.filter((serviceTypeId: string) => serviceTypeId !== id)
            : [...selectedServiceTypes, id];
        setValue("serviceTypeIds", next, { shouldValidate: true, shouldDirty: true });
    };

    const formProps = useListingFormProps({
        form,
        images,
        setImages,
        isEditMode,
        isSubmitting,
        onValidSubmit,
        businessData
    });

    if (isFetchingData) return <ListingModalLoading />;
    if (submittedService) {
        return (
            <ListingSubmissionSuccessModal
                entityLabel="Service"
                isEditMode={isEditMode}
                pendingActionLabel="View Pending Services"
                onPrimaryAction={() => {
                    void router.push("/");
                }}
                onSecondaryAction={() => {
                    void router.push(buildAccountListingRoute("services", "pending"));
                }}
            />
        );
    }

    return (
        <GenericPostForm
            {...formProps}
            title={isEditMode ? "Edit Service" : "Post a Service"}
            formId="post-service-form"
        >
            {isEditMode ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-foreground-secondary">
                    <p className="font-semibold text-foreground">Catalog fields are partially locked while editing.</p>
                    <p className="mt-1">
                        Category and brand stay fixed so this service keeps the same catalog placement. Create a new listing if those details changed.
                    </p>
                </div>
            ) : null}

            <CategorySelectorGrid
                categories={dynamicCategories}
                selectedCategoryId={categoryId}
                onSelect={handleCategorySelect}
                disabled={isEditMode}
                defaultIcon={Wrench}
                error={errors.categoryId?.message}
            />

            {categoryId && availableBrands.length > 0 && (
                <Field label="Brand" error={errors.brandId?.message}>
                    <BrandSearchSelect
                        brands={availableBrands}
                        brandMap={brandMap}
                        value={brandId || ""}
                        onChange={(id) => setValue("brandId", id || "", { shouldValidate: true, shouldDirty: true })}
                        disabled={isEditMode}
                    />
                </Field>
            )}

            {categoryId && (
                <Field label="Service Types" required error={getFirstFormErrorMessage(errors.serviceTypeIds)}>
                    {isLoadingServiceTypes ? (
                        <div className="grid grid-cols-2 gap-2">
                            {Array.from({ length: 4 }).map((_, index) => (
                                <div key={index} className="h-11 rounded-xl bg-slate-100 animate-pulse" />
                            ))}
                        </div>
                    ) : availableServiceTypes.length > 0 ? (
                        <>
                            <p className="mb-2 text-sm text-muted-foreground">
                                Select every service you offer for {selectedCategory?.name || "this category"}.
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                                {availableServiceTypes.map((serviceType) => {
                                    const typeId = serviceType.id || serviceType._id || serviceType.name;
                                    if (!typeId) return null;
                                    const selected = selectedServiceTypes.includes(typeId);
                                    return (
                                        <button
                                            key={typeId}
                                            type="button"
                                            onClick={() => toggleServiceType(typeId)}
                                            className={cn(
                                                "rounded-xl border px-3 py-3 text-left text-sm font-semibold transition-all",
                                                selected
                                                    ? "bg-primary border-primary text-white shadow-sm"
                                                    : "bg-white border-slate-100 text-foreground-secondary hover:border-slate-200"
                                            )}
                                        >
                                            {selected ? <Check className="mr-1 inline h-3.5 w-3.5" /> : null}
                                            {serviceType.name}
                                        </button>
                                    );
                                })}
                            </div>
                        </>
                    ) : isEditMode && selectedServiceTypes.length > 0 ? (
                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-foreground-secondary">
                            <p className="font-semibold text-foreground">Existing service types are preserved.</p>
                            <p className="mt-1">
                                This listing keeps its current service-type mapping while you edit pricing, photos, and description.
                            </p>
                        </div>
                    ) : (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                            <p className="font-semibold">This category cannot be posted yet.</p>
                            <p className="mt-1">
                                No service types are configured for {selectedCategory?.name || "this category"}.
                                Choose another category to continue.
                            </p>
                        </div>
                    )}
                </Field>
            )}

            <ListingTitleField
                label="Service Title"
                error={errors.title?.message}
                registerProps={register("title")}
                placeholder="e.g. iPhone Screen Replacement"
                valueLength={titleVal.length}
                maxLength={100}
            />

            <ListingPriceField
                label="Price (₹)"
                error={errors.price?.message}
                registerProps={register("price", { valueAsNumber: true })}
                showCurrencySymbol={true}
            />

            <ListingDescriptionField
                label="Description"
                error={errors.description?.message}
                registerProps={register("description")}
                placeholder="Describe your service: what's included, turnaround time, warranty..."
                valueLength={descVal.length}
            />
        </GenericPostForm>
    );
}
