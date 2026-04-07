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
import { ListingTitleField, ListingPriceField, ListingDescriptionField, CategorySelectorGrid, getFirstFormErrorMessage } from "../shared/ListingFormFields";
import { extractEntityId } from "../shared/listingFormShared";
import { ListingModalLoading } from "../shared/ListingModalLayout";
import { useListingCatalog } from "@/hooks/listings/useListingCatalog";
import { useListingSubmission } from "@/hooks/listings/useListingSubmission";
import { createListing, updateListing } from "@/lib/api/user/listings";
import { useGenericListingForm } from "../shared/useGenericListingForm";
import { GenericPostForm } from "../shared/GenericPostForm";
import { useListingFormProps } from "../shared/useListingFormProps";
import { ListingSubmissionSuccessModal } from "../shared/ListingSubmissionSuccessModal";
import { useRouter } from "next/navigation";
import { buildAccountListingRoute } from "@/lib/accountListingRoutes";
import { API_ROUTES } from "@/lib/api/routes";

export function PostServiceForm({ editServiceId }: { editServiceId?: string }) {
    const isEditMode = !!editServiceId;
    const router = useRouter();
    const [submittedService, setSubmittedService] = React.useState(false);

    const buildServiceCreatePayload = React.useCallback((payload: ServiceListingFormData) => {
        const { price, ...rest } = payload;
        return {
            ...rest,
            priceMin: price,
        };
    }, []);

    const buildServiceEditPayload = React.useCallback((payload: ServiceListingFormData) => ({
        title: payload.title,
        description: payload.description,
        images: payload.images,
        serviceTypeIds: payload.serviceTypeIds,
        priceMin: payload.price,
    }), []);

    const form = useForm<ServiceListingFormData>({
        resolver: zodResolver(ServiceListingPayloadSchema),
        mode: "all",
        shouldFocusError: true,
        defaultValues: {
            title: "",
            categoryId: "",
            brandId: "",
            serviceTypeIds: [],
            price: 0,
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
        availableBrands,
        brandMap,
        availableServiceTypes,
        isLoadingServiceTypes,
        loadBrandsForCategory,
        loadServiceTypes,
    } = useListingCatalog({ listingType: "postservice" });

    const selectedCategory = React.useMemo(
        () => dynamicCategories.find((category) => category.id === categoryId) || null,
        [dynamicCategories, categoryId]
    );

    const resolveServiceTypeIds = React.useCallback((tokens: string[], availableItems: any[]) => {
        const validIds = new Set<string>();
        const byName = new Map<string, string>();
        availableItems.forEach((typeItem: any) => {
            const id = typeItem.id?.trim();
            const name = typeItem.name?.trim().toLowerCase();
            if (!id) return;
            validIds.add(id);
            if (name) byName.set(name, id);
        });
        return Array.from(new Set(tokens.map((token) => {
            if (validIds.has(token)) return token;
            return byName.get(token.toLowerCase()) || token;
        })));
    }, []);

    const normalizeServiceTypeTokens = React.useCallback((value: any): string[] => {
        if (!value) return [];
        const tokens = Array.isArray(value) ? value : [String(value)];
        return tokens.map(t => typeof t === 'string' ? t : (t?.id || t?._id || '')).filter(Boolean);
    }, []);

    const onDataLoaded = React.useCallback(async (payload: any) => {
        const catId = extractEntityId(payload.category || payload.categoryId);
        const bId = extractEntityId(payload.brand || payload.brandId);
        const serviceTypeTokens = normalizeServiceTypeTokens(payload.serviceTypeIds || payload.serviceTypes);
        
        form.reset({
            title: payload.title || "",
            categoryId: catId,
            brandId: bId,
            serviceTypeIds: serviceTypeTokens,
            price: typeof payload.price === 'number' ? payload.price : (Number((payload as any).priceMin) || 0),
            description: payload.description || "",
        });

        if (catId) {
            const [, serviceTypes] = await Promise.all([
                loadBrandsForCategory(catId),
                loadServiceTypes(catId),
            ]);
            const resolvedIds = resolveServiceTypeIds(serviceTypeTokens, serviceTypes);
            if (resolvedIds.length > 0) {
                setValue("serviceTypeIds", resolvedIds, { shouldValidate: true });
            }
        }
    }, [form, loadBrandsForCategory, loadServiceTypes, normalizeServiceTypeTokens, resolveServiceTypeIds, setValue]);

    const { images, setImages, isFetchingData, businessData } = useGenericListingForm({
        form,
        editId: editServiceId,
        onDataLoaded
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
            ? selectedServiceTypes.filter(serviceTypeId => serviceTypeId !== id)
            : [...selectedServiceTypes, id];
        setValue("serviceTypeIds", next, { shouldValidate: true, shouldDirty: true });
    };

    const { onValidSubmit, isSubmitting } = useListingSubmission({
        form,
        listingImages: images,
        isEditMode,
        editId: editServiceId,
        schema: ServiceListingPayloadSchema,
        submitFn: async (payload, options) => {
            if (isEditMode && editServiceId) {
                return updateListing(editServiceId, buildServiceEditPayload(payload), {
                    endpoint: API_ROUTES.USER.SERVICE_DETAIL(editServiceId),
                });
            }
            return createListing(buildServiceCreatePayload(payload), {
                endpoint: API_ROUTES.USER.SERVICES,
                idempotencyKey: options?.idempotencyKey,
                errorMessage: "Failed to create service",
            });
        },
        onSuccess: () => {
            setSubmittedService(true);
        },
    });

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
