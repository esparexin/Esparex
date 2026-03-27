"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@/components/ui/utils";
import { Check, CircuitBoard } from "@/icons/IconRegistry";
import { BrandSearchSelect } from "@/components/user/BrandSearchSelect";
import { Field } from "@/components/ui/field";
import { ListingTitleField, ListingPriceField, ListingDescriptionField, CategorySelectorGrid } from "@/components/user/shared/ListingFormFields";
import { extractEntityId } from "@/components/user/shared/listingFormShared";
import { ListingModalLoading } from "@/components/user/shared/ListingModalLayout";
import { useListingCatalog } from "@/hooks/listings/useListingCatalog";
import { createListing, updateListing } from "@/lib/api/user/listings";
import { useListingSubmission } from "@/hooks/listings/useListingSubmission";
import {
    EditPostSparePartFormSchema,
    PostSparePartFormSchema,
    type PostSparePartFormValues,
} from "@/schemas/postSparePartForm.schema";
import { useGenericListingForm } from "@/components/user/shared/useGenericListingForm";
import { GenericPostForm } from "@/components/user/shared/GenericPostForm";
import { useListingFormProps } from "@/components/user/shared/useListingFormProps";
import { useRouter } from "next/navigation";
import { notify } from "@/lib/notify";
import { buildAccountListingRoute } from "@/lib/accountListingRoutes";

export default function PostSparePartForm({ editSparePartId }: { editSparePartId?: string }) {
    const isEditMode = !!editSparePartId;
    const router = useRouter();

    const form = useForm<PostSparePartFormValues>({
        resolver: zodResolver(PostSparePartFormSchema),
        defaultValues: {
            title: "",
            categoryId: "",
            brandId: "",
            sparePartTypeId: "",
            price: 0,
            description: "",
        },
    });

    const { register, watch, setValue, formState: { errors } } = form;
    const categoryId = watch("categoryId");
    const sparePartTypeId = watch("sparePartTypeId");

    const {
        dynamicCategories,
        availableBrands,
        brandMap,
        availableSpareParts,
        loadBrandsForCategory,
        loadSparePartsForCategory,
        isLoadingSpareParts,
    } = useListingCatalog({ listingType: "postsparepart" });

    const onDataLoaded = React.useCallback(async (payload: any) => {
        const resolvedCategoryId = extractEntityId(payload.categoryId || payload.category);
        form.reset({
            title: payload.title || "",
            categoryId: resolvedCategoryId,
            brandId: extractEntityId(payload.brandId || payload.brand),
            sparePartTypeId: extractEntityId(payload.sparePartId || (payload as { sparePartTypeId?: unknown }).sparePartTypeId),
            price: typeof payload.price === 'number' ? payload.price : 0,
            description: payload.description || "",
            location: payload.location as any
        });
        if (resolvedCategoryId) {
            await Promise.all([
                loadBrandsForCategory(resolvedCategoryId),
                loadSparePartsForCategory(resolvedCategoryId),
            ]);
        }
    }, [form, loadBrandsForCategory, loadSparePartsForCategory]);

    const { images, setImages, isFetchingData, businessData } = useGenericListingForm({
        form,
        editId: editSparePartId,
        onDataLoaded
    });

    const handleCategorySelect = async (id: string) => {
        setValue("categoryId", id);
        setValue("brandId", "");
        setValue("sparePartTypeId", "");
        await Promise.all([loadBrandsForCategory(id), loadSparePartsForCategory(id)]);
    };

    const { onValidSubmit, isSubmitting } = useListingSubmission({
        form,
        listingImages: images,
        isEditMode,
        editId: editSparePartId,
        schema: PostSparePartFormSchema,
        partialSchema: EditPostSparePartFormSchema,
        submitFn: async (payload) => {
            if (isEditMode && editSparePartId) {
                return updateListing(editSparePartId, {
                    title: payload.title,
                    description: payload.description,
                    price: payload.price,
                    images: payload.images,
                });
            }
            return createListing({
                ...payload,
                sparePartId: payload.sparePartTypeId,
                condition: "new",
                locationId: (payload.location as any)?.locationId || businessData?.location?.locationId,
            });
        },
        onSuccess: () => {
            notify.success(isEditMode ? "Spare part updated successfully" : "Spare part submitted for review");
            router.push(buildAccountListingRoute("spare-parts", "pending"));
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

    return (
        <GenericPostForm
            {...formProps}
            title={isEditMode ? "Edit Spare Part" : "Post Spare Part"}
            formId="post-spare-part-form"
        >
            <CategorySelectorGrid
                categories={dynamicCategories}
                selectedCategoryId={categoryId}
                onSelect={handleCategorySelect}
                disabled={isEditMode}
                defaultIcon={CircuitBoard}
                error={errors.categoryId?.message}
            />

            {categoryId && availableBrands.length > 0 && (
                <Field label="Brand" error={errors.brandId?.message}>
                    <BrandSearchSelect
                        brands={availableBrands}
                        brandMap={brandMap}
                        value={watch("brandId") || ""}
                        onChange={(id) => setValue("brandId", id || "", { shouldValidate: true })}
                        disabled={isEditMode}
                    />
                </Field>
            )}

            {categoryId && (
                <Field label="Spare Part" error={errors.sparePartTypeId?.message}>
                    {isLoadingSpareParts ? (
                        <div className="grid grid-cols-3 gap-2">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="h-10 bg-slate-100 rounded-xl animate-pulse" />
                            ))}
                        </div>
                    ) : availableSpareParts.length > 0 ? (
                        <div className="grid grid-cols-3 gap-2">
                            {availableSpareParts.map(part => {
                                const id = part.id || (part as { _id?: string })._id || "";
                                const selected = sparePartTypeId === id;
                                return (
                                    <button
                                        key={id}
                                        type="button"
                                        onClick={() => setValue("sparePartTypeId", id, { shouldValidate: true })}
                                        disabled={isEditMode}
                                        className={cn(
                                            "py-2.5 px-2 rounded-xl border text-xs font-bold transition-all",
                                            selected
                                                ? "bg-primary border-primary text-white shadow-sm"
                                                : "bg-white border-slate-100 text-slate-600 hover:border-slate-200",
                                            isEditMode && !selected ? "opacity-40" : ""
                                        )}
                                    >
                                        {selected && <Check className="w-3 h-3 inline mr-1" />}
                                        <span className="truncate">{part.name}</span>
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-xs text-slate-400 text-center py-3">No spare parts for this category.</p>
                    )}
                </Field>
            )}

            <ListingTitleField
                label="Part Title"
                error={errors.title?.message}
                registerProps={register("title")}
                placeholder="e.g. iPhone 14 OEM Display Screen"
                valueLength={(watch("title") || "").length}
            />

            <ListingPriceField
                label="Price (₹)"
                error={errors.price?.message}
                registerProps={register("price", { valueAsNumber: true })}
            />

            <ListingDescriptionField
                label="Description"
                error={errors.description?.message}
                registerProps={register("description")}
                placeholder="Describe origin, quality, compatibility notes..."
                valueLength={(watch("description") || "").length}
            />
        </GenericPostForm>
    );
}
