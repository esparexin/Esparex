"use client";

import React from "react";
import logger from "@/lib/logger";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { cn } from "@/components/ui/utils";
import { Loader2, Check, CircuitBoard } from "@/icons/IconRegistry";
import { BrandSearchSelect } from "@/components/user/BrandSearchSelect";
import { ListingImagesField, ListingLocationField, ListingTitleField, ListingPriceField, ListingDescriptionField, CategorySelectorGrid } from "@/components/user/shared/ListingFormFields";
import {
    appendListingImages,
    createRemoteListingImages,
    extractEntityId,
    getBusinessLocationDisplay,
    removeListingImageById,
    toListingLocationFromBusiness,
} from "@/components/user/shared/listingFormShared";
import { ListingModalLayout, ListingModalBody, ListingModalFooter, ListingModalLoading } from "@/components/user/shared/ListingModalLayout";
import { useAuth } from "@/context/AuthContext";
import { useBusiness } from "@/hooks/useBusiness";
import { useListingCatalog } from "@/hooks/listings/useListingCatalog";
import { createSparePartListing, updateSparePartListing } from "@/lib/api/user/sparePartListings";
import { getListingById } from "@/lib/api/user/ads";
import { useListingSubmission } from "@/hooks/listings/useListingSubmission";
import type { ListingImage } from "@/types/listing";
import {
    EditPostSparePartFormSchema,
    PostSparePartFormSchema,
    type PostSparePartFormValues,
} from "@/schemas/postSparePartForm.schema";

// ─── Component ───────────────────────────────────────────────────────────────
export default function PostSparePartForm({ editSparePartId }: { editSparePartId?: string }) {
    const router = useRouter();
    const { user } = useAuth();
    const { businessData } = useBusiness(user);

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

    const { register, watch, setValue, handleSubmit, formState: { errors } } = form;
    const categoryId = watch("categoryId");
    const sparePartTypeId = watch("sparePartTypeId");

    // ─── Catalog ───────────────────────────────────────────────────────────
    const {
        dynamicCategories,
        availableBrands,
        brandMap,
        availableSpareParts,
        loadBrandsForCategory,
        loadSparePartsForCategory,
        isLoadingSpareParts,
    } = useListingCatalog({ listingType: "postsparepart" });

    // ─── Pre-fill location ─────────────────────────────────────────────────
    React.useEffect(() => {
        if (!businessData?.location || editSparePartId) return;
        const location = toListingLocationFromBusiness(businessData.location);
        if (location) form.setValue("location", location);
    }, [businessData, form, editSparePartId]);

    // ─── Images (local) ────────────────────────────────────────────────────
    const [images, setImages] = React.useState<ListingImage[]>([]);
    const [isFetchingData, setIsFetchingData] = React.useState(!!editSparePartId);
    const isEditMode = !!editSparePartId;

    React.useEffect(() => {
        if (!editSparePartId) return;

        let isMounted = true;
        const loadListing = async () => {
            try {
                const payload = await getListingById(editSparePartId);
                if (isMounted && payload) {
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

                    if (payload.images && Array.isArray(payload.images)) {
                        setImages(createRemoteListingImages(payload.images));
                    }
                }
            } catch (e) {
                logger.error("Failed to load spare part", e);
            } finally {
                if (isMounted) setIsFetchingData(false);
            }
        };
        loadListing();
        return () => { isMounted = false; };
    }, [editSparePartId, form, loadBrandsForCategory, loadSparePartsForCategory]);
    const handleImageUpload = (files: File[]) =>
        setImages((prev) => appendListingImages(prev, files));

    const removeImage = (id: string) =>
        setImages((prev) => removeListingImageById(prev, id));

    // ─── Handlers ─────────────────────────────────────────────────────────
    const handleCategorySelect = async (id: string) => {
        setValue("categoryId", id);
        setValue("brandId", "");
        setValue("sparePartTypeId", "");
        await Promise.all([loadBrandsForCategory(id), loadSparePartsForCategory(id)]);
    };

    // ─── Submission ───────────────────────────────────────────────────────
    const [formError, setFormError] = React.useState<string | null>(null);

    const { onValidSubmit, isSubmitting } = useListingSubmission({
        form,
        listingImages: images,
        isEditMode,
        editId: editSparePartId,
        schema: PostSparePartFormSchema,
        partialSchema: EditPostSparePartFormSchema,
        submitFn: async (payload) => {
            if (isEditMode && editSparePartId) {
                // Update schema is .strict() — only send allowed content fields
                return updateSparePartListing(editSparePartId, {
                    title: payload.title,
                    description: payload.description,
                    price: payload.price,
                    images: payload.images,
                });
            }
            // Create: map sparePartTypeId → sparePartId (backend field name)
            // Also hoist locationId to top-level — backend controller requires it there
            return createSparePartListing({
                categoryId: payload.categoryId,
                sparePartId: payload.sparePartTypeId,
                brandId: payload.brandId || undefined,
                condition: "new",
                title: payload.title,
                description: payload.description,
                price: payload.price,
                images: payload.images,
                location: payload.location,
                locationId: (payload.location as any)?.locationId || businessData?.location?.locationId,
            });
        },
        onSuccess: () => router.push(isEditMode ? "/account/ads" : "/post-spare-part-success"),
        onError: (msg) => setFormError(msg),
    });

    const locationDisplay = form.watch("location.display") || getBusinessLocationDisplay(businessData?.location);

    if (isFetchingData) {
        return <ListingModalLoading />;
    }

    // ─── Render ──────────────────────────────────────────────────────────
    return (
        <FormProvider {...form}>
            {/* Overlay — full-screen mobile, centred modal on desktop */}
            <ListingModalLayout
                title={isEditMode ? "Edit Spare Part" : "Post Spare Part"}
                onClose={() => router.back()}
            >
                <ListingModalBody>
                        <form id="post-spare-part-form" onSubmit={handleSubmit(onValidSubmit)} className="space-y-6">

                            {formError && (
                                <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm border border-red-100 font-medium">
                                    {formError}
                                </div>
                            )}

                            {/* Category */}
                            <section className="space-y-3">
                                <Field label="Select Category" error={errors.categoryId?.message}>
                                    <CategorySelectorGrid
                                        categories={dynamicCategories}
                                        selectedCategoryId={categoryId}
                                        onSelect={handleCategorySelect}
                                        disabled={isEditMode}
                                        defaultIcon={CircuitBoard}
                                    />
                                </Field>
                            </section>

                            {/* Brand */}
                            {categoryId && availableBrands.length > 0 && (
                                <section className="space-y-3">
                                    <Field label="Brand" error={errors.brandId?.message}>
                                        <BrandSearchSelect
                                            brands={availableBrands}
                                            brandMap={brandMap}
                                            value={watch("brandId") || ""}
                                            onChange={(id) => setValue("brandId", id || "", { shouldValidate: true })}
                                            disabled={isEditMode}
                                        />
                                    </Field>
                                </section>
                            )}

                            {/* Spare Part Type */}
                            {categoryId && (
                                <section className="space-y-3">
                                    <Field label="Spare Part" error={errors.sparePartTypeId?.message}>
                                        {isLoadingSpareParts ? (
                                            <div className="grid grid-cols-3 gap-2">
                                                {[1,2,3,4,5,6].map(i => (
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
                                </section>
                            )}

                            {/* Title */}
                            <ListingTitleField
                                label="Part Title"
                                error={errors.title?.message}
                                registerProps={register("title")}
                                placeholder="e.g. iPhone 14 OEM Display Screen"
                                valueLength={(watch("title") || "").length}
                            />

                            {/* Price */}
                            <ListingPriceField
                                label="Price (₹)"
                                error={errors.price?.message}
                                registerProps={register("price", { valueAsNumber: true })}
                            />

                            {/* Description */}
                            <ListingDescriptionField
                                label="Description"
                                error={errors.description?.message}
                                registerProps={register("description")}
                                placeholder="Describe origin, quality, compatibility notes..."
                                valueLength={(watch("description") || "").length}
                            />

                            <ListingImagesField
                                images={images}
                                onUpload={handleImageUpload}
                                onRemove={removeImage}
                                firstImageBadgeLabel="MAIN"
                            />

                            <ListingLocationField
                                display={locationDisplay}
                                placeholder="Loading business location..."
                                fixedLabel="Fixed Address"
                            />

                        </form>
                </ListingModalBody>

                {/* Footer — inside modal card, NOT viewport-fixed */}
                <ListingModalFooter>
                    <Button
                        type="submit"
                        form="post-spare-part-form"
                        disabled={isSubmitting}
                        className="w-full h-12 rounded-2xl font-bold text-base bg-primary text-white shadow-lg disabled:opacity-70"
                    >
                        {isSubmitting ? (
                            <span className="flex items-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> Submitting...</span>
                        ) : (isEditMode ? "Save Changes →" : "Submit Spare Part →")}
                    </Button>
                </ListingModalFooter>
            </ListingModalLayout>
        </FormProvider>
    );
}
