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
import { ListingTitleField, ListingPriceField, ListingDescriptionField, CategorySelectorGrid } from "../shared/ListingFormFields";
import { extractEntityId } from "../shared/listingFormShared";
import { ListingModalLoading } from "../shared/ListingModalLayout";
import { useListingCatalog } from "@/hooks/listings/useListingCatalog";
import { useListingSubmission } from "@/hooks/listings/useListingSubmission";
import { createService, updateService } from "@/lib/api/user/services";
import { useGenericListingForm } from "../shared/useGenericListingForm";
import { GenericPostForm } from "../shared/GenericPostForm";
import { useListingFormProps } from "../shared/useListingFormProps";

export function PostServiceForm({ editServiceId }: { editServiceId?: string }) {
    const isEditMode = !!editServiceId;

    const form = useForm<ServiceListingFormData>({
        resolver: zodResolver(ServiceListingPayloadSchema),
        defaultValues: {
            title: "",
            categoryId: "",
            brandId: "",
            serviceTypeIds: [],
            price: 0,
            description: "",
        },
    });

    const { register, watch, setValue } = form;

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
        loadBrandsForCategory,
        loadServiceTypes,
    } = useListingCatalog({ listingType: "postservice" });

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
            location: payload.location,
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

    const handleCategorySelect = async (id: string) => {
        setValue("categoryId", id);
        setValue("brandId", "");
        setValue("serviceTypeIds", []);
        await Promise.all([loadBrandsForCategory(id), loadServiceTypes(id)]);
    };

    const toggleServiceType = (id: string) => {
        const next = selectedServiceTypes.includes(id)
            ? selectedServiceTypes.filter(serviceTypeId => serviceTypeId !== id)
            : [...selectedServiceTypes, id];
        setValue("serviceTypeIds", next, { shouldValidate: true });
    };

    const { onValidSubmit, isSubmitting } = useListingSubmission({
        form,
        listingImages: images,
        isEditMode,
        editId: editServiceId,
        schema: ServiceListingPayloadSchema,
        submitFn: async (payload) => {
            if (isEditMode && editServiceId) return updateService(editServiceId, payload);
            return createService(payload);
        },
        onSuccess: () => {}, // Handled by router in formProps.onClose or success path
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

    return (
        <GenericPostForm
            {...formProps}
            title={isEditMode ? "Edit Service" : "Post a Service"}
            formId="post-service-form"
        >
            <CategorySelectorGrid
                categories={dynamicCategories}
                selectedCategoryId={categoryId}
                onSelect={handleCategorySelect}
                disabled={isEditMode}
                defaultIcon={Wrench}
                error={form.formState.errors.categoryId?.message}
            />

            {categoryId && availableBrands.length > 0 && (
                <Field label="Brand" error={form.formState.errors.brandId?.message}>
                    <BrandSearchSelect
                        brands={availableBrands}
                        brandMap={brandMap}
                        value={brandId || ""}
                        onChange={(id) => setValue("brandId", id || "", { shouldValidate: true })}
                        disabled={isEditMode}
                    />
                </Field>
            )}

            {categoryId && availableServiceTypes.length > 0 && (
                <Field label="Service Types" error={form.formState.errors.serviceTypeIds?.message}>
                    <p className="text-xs text-slate-500 -mt-1 mb-2">Select all that apply</p>
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
                                        "py-2.5 px-3 rounded-xl border text-xs font-bold transition-all text-left",
                                        selected
                                            ? "bg-primary border-primary text-white shadow-sm"
                                            : "bg-white border-slate-100 text-slate-600 hover:border-slate-200"
                                    )}
                                >
                                    {selected && <Check className="w-3 h-3 inline mr-1" />}
                                    {serviceType.name}
                                </button>
                            );
                        })}
                    </div>
                </Field>
            )}

            <ListingTitleField
                label="Service Title"
                error={form.formState.errors.title?.message}
                registerProps={register("title")}
                placeholder="e.g. iPhone Screen Replacement"
                valueLength={titleVal.length}
            />

            <ListingPriceField
                label="Price (₹)"
                error={form.formState.errors.price?.message}
                registerProps={register("price", { valueAsNumber: true })}
                showCurrencySymbol={true}
            />

            <ListingDescriptionField
                label="Description"
                error={form.formState.errors.description?.message}
                registerProps={register("description")}
                placeholder="Describe your service: what's included, turnaround time, warranty..."
                valueLength={descVal.length}
            />
        </GenericPostForm>
    );
}
