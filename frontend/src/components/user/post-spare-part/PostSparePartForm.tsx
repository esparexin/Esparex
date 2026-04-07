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
import { ListingSubmissionSuccessModal } from "@/components/user/shared/ListingSubmissionSuccessModal";
import { useRouter } from "next/navigation";
import { buildAccountListingRoute } from "@/lib/accountListingRoutes";
import { API_ROUTES } from "@/lib/api/routes";

type SparePartSubmitPayload = {
    title: string;
    categoryId: string;
    brandId?: string;
    sparePartTypeId: string;
    price: number;
    description: string;
    images: string[];
};

export default function PostSparePartForm({ editSparePartId }: { editSparePartId?: string }) {
    const isEditMode = !!editSparePartId;
    const router = useRouter();
    const [submittedSparePart, setSubmittedSparePart] = React.useState(false);

    const buildSparePartCreatePayload = React.useCallback((payload: SparePartSubmitPayload) => ({
        title: payload.title,
        categoryId: payload.categoryId,
        brandId: payload.brandId || undefined,
        sparePartId: payload.sparePartTypeId,
        price: payload.price,
        description: payload.description,
        images: payload.images,
    }), []);

    const buildSparePartEditPayload = React.useCallback((payload: SparePartSubmitPayload) => ({
        title: payload.title,
        description: payload.description,
        price: payload.price,
        images: payload.images,
    }), []);

    const form = useForm<PostSparePartFormValues>({
        resolver: zodResolver(PostSparePartFormSchema),
        mode: "all",
        shouldFocusError: true,
        defaultValues: {
            title: "",
            categoryId: "",
            brandId: "",
            sparePartTypeId: "",
            price: 0,
            description: "",
        },
    });

    const { register, watch, setValue, setError, clearErrors, formState: { errors } } = form;
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

    React.useEffect(() => {
        if (!categoryId) {
            clearErrors("sparePartTypeId");
            return;
        }
        if (isLoadingSpareParts) return;
        if (availableSpareParts.length === 0) {
            if (sparePartTypeId) {
                clearErrors("sparePartTypeId");
                return;
            }
            setError("sparePartTypeId", {
                type: "manual",
                message: "No spare parts are configured for this category yet. Choose another category to continue."
            });
            return;
        }
        clearErrors("sparePartTypeId");
    }, [availableSpareParts.length, categoryId, clearErrors, isLoadingSpareParts, setError, sparePartTypeId]);

    const handleCategorySelect = async (id: string) => {
        setValue("categoryId", id, { shouldDirty: true, shouldValidate: true });
        setValue("brandId", "", { shouldDirty: true, shouldValidate: true });
        setValue("sparePartTypeId", "", { shouldDirty: true, shouldValidate: true });
        clearErrors("sparePartTypeId");
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
                return updateListing(editSparePartId, buildSparePartEditPayload(payload), {
                    endpoint: API_ROUTES.USER.SPARE_PART_LISTING_DETAIL(String(editSparePartId)),
                });
            }
            return createListing(buildSparePartCreatePayload(payload), {
                endpoint: API_ROUTES.USER.SPARE_PART_LISTINGS,
            });
        },
        onSuccess: () => {
            setSubmittedSparePart(true);
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
    if (submittedSparePart) {
        return (
            <ListingSubmissionSuccessModal
                entityLabel="Spare Part"
                isEditMode={isEditMode}
                pendingActionLabel="View Pending Spare Parts"
                onPrimaryAction={() => {
                    void router.push("/");
                }}
                onSecondaryAction={() => {
                    void router.push(buildAccountListingRoute("spare-parts", "pending"));
                }}
            />
        );
    }

    return (
        <GenericPostForm
            {...formProps}
            title={isEditMode ? "Edit Spare Part" : "Post Spare Part"}
            formId="post-spare-part-form"
        >
            {isEditMode ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-foreground-secondary">
                    <p className="font-semibold text-foreground">Catalog fields are locked while editing.</p>
                    <p className="mt-1">
                        Category, brand, and spare part type stay fixed so this listing remains mapped to the same catalog item.
                    </p>
                </div>
            ) : null}

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
                        onChange={(id) => setValue("brandId", id || "", { shouldValidate: true, shouldDirty: true })}
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
                                        onClick={() => setValue("sparePartTypeId", id, { shouldValidate: true, shouldDirty: true })}
                                        disabled={isEditMode}
                                        className={cn(
                                            "rounded-xl border px-2 py-3 text-sm font-semibold transition-all",
                                            selected
                                                ? "bg-primary border-primary text-white shadow-sm"
                                                : "bg-white border-slate-100 text-foreground-secondary hover:border-slate-200",
                                            isEditMode && !selected ? "opacity-40" : ""
                                        )}
                                    >
                                        {selected && <Check className="mr-1 inline h-3.5 w-3.5" />}
                                        <span className="truncate">{part.name}</span>
                                    </button>
                                );
                            })}
                        </div>
                    ) : isEditMode && sparePartTypeId ? (
                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-foreground-secondary">
                            <p className="font-semibold text-foreground">Existing spare-part mapping is preserved.</p>
                            <p className="mt-1">
                                This listing keeps its current catalog mapping while you edit pricing, photos, and description.
                            </p>
                        </div>
                    ) : (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                            <p className="font-semibold">This category cannot be posted yet.</p>
                            <p className="mt-1">
                                No spare parts are configured for this category. Choose another category to continue.
                            </p>
                        </div>
                    )}
                </Field>
            )}

            <ListingTitleField
                label="Part Title"
                error={errors.title?.message}
                registerProps={register("title")}
                placeholder="e.g. iPhone 14 OEM Display Screen"
                valueLength={(watch("title") || "").length}
                maxLength={120}
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
