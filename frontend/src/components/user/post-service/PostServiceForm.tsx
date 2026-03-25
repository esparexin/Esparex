"use client";

import React from "react";
import logger from "@/lib/logger";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
    ServiceListingPayloadSchema,
    type ServiceListingFormData,
} from "@/schemas/serviceListingPayload.schema";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { cn } from "@/components/ui/utils";
import { Loader2, Check, Wrench } from "@/icons/IconRegistry";
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
import { useListingSubmission } from "@/hooks/listings/useListingSubmission";
import { getListingById } from "@/lib/api/user/ads";
import { createService, updateService } from "@/lib/api/user/services";
import type { ListingImage } from "@/types/listing";

// Schema imported from shared base — keeps frontend validation aligned with backend.
// See frontend/src/schemas/serviceListingPayload.schema.ts
const PostServiceSchema = ServiceListingPayloadSchema;
type PostServiceValues = ServiceListingFormData;

// ─── Component ───────────────────────────────────────────────────────────────
export function PostServiceForm({ editServiceId }: { editServiceId?: string }) {
    const router = useRouter();
    const { user } = useAuth();
    const { businessData } = useBusiness(user);
    const isEditMode = !!editServiceId;

    const form = useForm<PostServiceValues>({
        resolver: zodResolver(PostServiceSchema),
        defaultValues: {
            title: "",
            categoryId: "",
            brandId: "",
            serviceTypeIds: [],
            price: 0,
            description: "",
        },
    });

    const { register, watch, setValue, handleSubmit, formState: { errors } } = form;
    const categoryId = watch("categoryId");
    const brandId = watch("brandId");
    const selectedServiceTypes = watch("serviceTypeIds") || [];
    const titleVal = watch("title") || "";
    const descVal = watch("description") || "";

    // ─── Catalog ───────────────────────────────────────────────────────────
    const {
        dynamicCategories,
        availableBrands,
        brandMap,
        availableServiceTypes,
        loadBrandsForCategory,
        loadServiceTypes,
    } = useListingCatalog({ listingType: "postservice" });

    // ─── Pre-fill location from business ───────────────────────────────────
    React.useEffect(() => {
        if (!businessData?.location || editServiceId) return;
        const location = toListingLocationFromBusiness(businessData.location);
        if (location) setValue("location", location);
    }, [businessData, editServiceId, setValue]);

    // ─── Images ────────────────────────────────────────────────────────────
    const [images, setImages] = React.useState<ListingImage[]>([]);
    const [isFetchingData, setIsFetchingData] = React.useState(!!editServiceId);

    const normalizeServiceTypeTokens = React.useCallback((value: unknown): string[] => {
        if (!Array.isArray(value)) return [];
        return value
            .map((entry) => {
                if (typeof entry === "string") return entry.trim();
                if (entry && typeof entry === "object") return extractEntityId(entry).trim();
                return "";
            })
            .filter((token) => token.length > 0);
    }, []);

    const resolveServiceTypeIds = React.useCallback((
        tokens: string[],
        types: Array<{ id?: string; name?: string }>
    ): string[] => {
        if (tokens.length === 0) return [];
        const byName = new Map<string, string>();
        const validIds = new Set<string>();
        types.forEach((typeItem) => {
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

    // ─── Load existing service for edit ────────────────────────────────────
    React.useEffect(() => {
        if (!editServiceId) return;
        let isMounted = true;
        const load = async () => {
            try {
                const payload = await getListingById(editServiceId);
                if (isMounted && payload) {
                    const categoryId = extractEntityId(payload.category || payload.categoryId);
                    const brandId = extractEntityId(payload.brand || payload.brandId);
                    const serviceTypeTokens = normalizeServiceTypeTokens(payload.serviceTypeIds || payload.serviceTypes);
                    form.reset({
                        title: payload.title || "",
                        categoryId,
                        brandId,
                        serviceTypeIds: serviceTypeTokens,
                        price: typeof payload.price === 'number' ? payload.price : (Number((payload as any).priceMin) || 0),
                        description: payload.description || "",
                        location: payload.location,
                    });
                    if (categoryId) {
                        const [, serviceTypes] = await Promise.all([
                            loadBrandsForCategory(categoryId),
                            loadServiceTypes(categoryId),
                        ]);
                        const resolvedIds = resolveServiceTypeIds(serviceTypeTokens, serviceTypes);
                        if (resolvedIds.length > 0) {
                            setValue("serviceTypeIds", resolvedIds, { shouldValidate: true });
                        }
                    }
                    if (payload.images?.length) {
                        setImages(createRemoteListingImages(payload.images));
                    }
                }
            } catch (e) {
                logger.error("Failed to load service", e);
            } finally {
                if (isMounted) setIsFetchingData(false);
            }
        };
        load();
        return () => { isMounted = false; };
    }, [editServiceId, form, loadBrandsForCategory, loadServiceTypes, normalizeServiceTypeTokens, resolveServiceTypeIds, setValue]);

    // ─── Handlers ─────────────────────────────────────────────────────────
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

    const handleImageUpload = (files: File[]) =>
        setImages((prev) => appendListingImages(prev, files));

    const removeImage = (id: string) =>
        setImages((prev) => removeListingImageById(prev, id));

    // ─── Submission ────────────────────────────────────────────────────────
    const { onValidSubmit, isSubmitting } = useListingSubmission({
        form,
        listingImages: images,
        isEditMode,
        editId: editServiceId,
        schema: PostServiceSchema,
        submitFn: async (payload) => {
            if (isEditMode && editServiceId) return updateService(editServiceId, payload);
            return createService(payload);
        },
        onSuccess: () => router.push(isEditMode ? "/account/ads" : "/post-service-success"),
    });

    const locationDisplay =
        watch("location.display") ||
        getBusinessLocationDisplay(businessData?.location);

    if (isFetchingData) {
        return <ListingModalLoading />;
    }

    // ─── Render — PostAd-identical shell ──────────────────────────────────
    return (
        <FormProvider {...form}>
            {/* Overlay wrapper — full-screen mobile, centred modal on desktop */}
            <ListingModalLayout
                title={isEditMode ? "Edit Service" : "Post a Service"}
                onClose={() => router.back()}
            >
                <ListingModalBody>
                        <form
                            id="post-service-form"
                            onSubmit={handleSubmit(onValidSubmit)}
                            className="space-y-8"
                        >
                            {/* Category */}
                            <Field label="Select Category" error={errors.categoryId?.message}>
                                <CategorySelectorGrid
                                    categories={dynamicCategories}
                                    selectedCategoryId={categoryId}
                                    onSelect={handleCategorySelect}
                                    disabled={isEditMode}
                                    defaultIcon={Wrench}
                                />
                            </Field>

                            {/* Brand */}
                            {categoryId && availableBrands.length > 0 && (
                                <Field label="Brand" error={errors.brandId?.message}>
                                    <BrandSearchSelect
                                        brands={availableBrands}
                                        brandMap={brandMap}
                                        value={brandId || ""}
                                        onChange={(id) => setValue("brandId", id || "", { shouldValidate: true })}
                                        disabled={isEditMode}
                                    />
                                </Field>
                            )}

                            {/* Service Types */}
                            {categoryId && availableServiceTypes.length > 0 && (
                                <Field label="Service Types" error={errors.serviceTypeIds?.message}>
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

                            {/* Title */}
                            <ListingTitleField
                                label="Service Title"
                                error={errors.title?.message}
                                registerProps={register("title")}
                                placeholder="e.g. iPhone Screen Replacement"
                                valueLength={titleVal.length}
                            />

                            {/* Price */}
                            <ListingPriceField
                                label="Price (₹)"
                                error={errors.price?.message}
                                registerProps={register("price", { valueAsNumber: true })}
                                showCurrencySymbol={true}
                            />

                            {/* Description */}
                            <ListingDescriptionField
                                label="Description"
                                error={errors.description?.message}
                                registerProps={register("description")}
                                placeholder="Describe your service: what's included, turnaround time, warranty..."
                                valueLength={descVal.length}
                            />

                            <ListingImagesField
                                images={images}
                                onUpload={handleImageUpload}
                                onRemove={removeImage}
                                firstImageBadgeLabel="COVER"
                            />

                            <ListingLocationField display={locationDisplay} fixedLabel="Fixed" />

                        </form>
                </ListingModalBody>

                {/* ── Footer ── */}
                <ListingModalFooter>
                    <Button
                        type="submit"
                        form="post-service-form"
                        disabled={isSubmitting || images.length === 0}
                        className={cn(
                            "w-full rounded-xl font-bold transition-all active:scale-[0.98]",
                            "h-14 text-lg sm:h-12 sm:text-base",
                            "bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-100 disabled:opacity-70"
                        )}
                    >
                        {isSubmitting ? (
                            <span className="flex items-center gap-2">
                                <Loader2 className="w-5 h-5 animate-spin" /> Submitting...
                            </span>
                        ) : images.length === 0 ? (
                            "Add at least 1 photo to submit"
                        ) : (
                            isEditMode ? "Save Changes" : "Submit Service →"
                        )}
                    </Button>
                </ListingModalFooter>
            </ListingModalLayout>
        </FormProvider>
    );
}
