"use client";

import React from "react";
import { useForm, useWatch, type UseFormRegister } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@/components/ui/utils";
import { Check, CircuitBoard } from "@/icons/IconRegistry";
import { BrandSearchSelect } from "@/components/user/BrandSearchSelect";
import { Field } from "@/components/ui/field";
import { ListingTitleField, ListingPriceField, ListingDescriptionField, CategorySelectorGrid } from "@/components/user/shared/ListingFormFields";
import { ListingModalLoading } from "@/components/user/shared/ListingModalLayout";
import { useBrandCatalog } from "@/hooks/listings/useBrandCatalog";
import { useListingCategories } from "@/hooks/listings/useListingCategories";
import { useSparePartCatalog } from "@/hooks/listings/useSparePartCatalog";
import {
    PostSparePartFormSchema,
    type PostSparePartFormValues,
} from "@/schemas/postSparePartForm.schema";
import { GenericPostForm } from "@/components/user/shared/GenericPostForm";
import { useListingFormProps } from "@/components/user/shared/useListingFormProps";
import { ListingSubmissionSuccessModal } from "@/components/user/shared/ListingSubmissionSuccessModal";
import { useRouter } from "next/navigation";
import { buildAccountListingRoute } from "@/lib/accountListingRoutes";
import { usePostSparePartFormOrchestration } from "./hooks/usePostSparePartFormOrchestration";
import { LISTING_TYPE } from "@shared/enums/listingType";

function PostSparePartTitleField({ register, error }: { register: ReturnType<UseFormRegister<PostSparePartFormValues>>; error?: string }) {
    const title = useWatch({ name: "title" }) as string || "";
    return (
        <ListingTitleField
            label="Part Title"
            error={error}
            registerProps={register}
            placeholder="e.g. iPhone 14 OEM Display Screen"
            valueLength={title.length}
            maxLength={120}
        />
    );
}

function PostSparePartDescriptionField({ register, error }: { register: ReturnType<UseFormRegister<PostSparePartFormValues>>; error?: string }) {
    const description = useWatch({ name: "description" }) as string || "";
    return (
        <ListingDescriptionField
            label="Description"
            error={error}
            registerProps={register}
            placeholder="Describe origin, quality, compatibility notes..."
            valueLength={description.length}
            maxLength={2000}
        />
    );
}

export default function PostSparePartForm({ editSparePartId }: { editSparePartId?: string }) {
    const isEditMode = !!editSparePartId;
    const router = useRouter();
    const [submittedSparePart, setSubmittedSparePart] = React.useState(false);

    const form = useForm<PostSparePartFormValues>({
        resolver: zodResolver(PostSparePartFormSchema),
        mode: "all",
        shouldFocusError: true,
        defaultValues: {
            title: "",
            categoryId: "",
            brandId: "",
            sparePartTypeId: "",
            price: undefined as unknown as number, // A5: forces user to enter a price
            description: "",
        },
    });

    const { register, setValue, setError, clearErrors, control, formState: { errors } } = form;
    
    // Only watch category, spare part type and brand in the heavy parent component.
    const [categoryId, sparePartTypeId, brandId] = useWatch({
        control,
        name: ["categoryId", "sparePartTypeId", "brandId"],
    }) as [string, string, string];

    const {
        dynamicCategories,
        categoryMap,
    } = useListingCategories({ listingType: LISTING_TYPE.SPARE_PART });
    const {
        availableBrands,
        brandMap,
        loadBrandsForCategory,
    } = useBrandCatalog({
        categoryMap,
        includeScreenSizes: false,
    });
    const {
        availableSpareParts,
        loadSparePartsForCategory,
        isLoadingSpareParts,
    } = useSparePartCatalog({ listingType: LISTING_TYPE.SPARE_PART });

    const { images, setImages, isFetchingData, businessData, onValidSubmit, isSubmitting } = usePostSparePartFormOrchestration({
        form,
        editSparePartId,
        loadBrandsForCategory,
        loadSparePartsForCategory,
        onSubmitted: () => setSubmittedSparePart(true),
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
                        value={brandId || ""}
                        categoryId={categoryId}
                        onChange={(id) => setValue("brandId", id || "", { shouldValidate: true, shouldDirty: true })}
                        disabled={isEditMode}
                    />
                </Field>
            )}

            {categoryId && (
                <Field label="Spare Part" required error={errors.sparePartTypeId?.message}>
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

            <PostSparePartTitleField
                register={register("title")}
                error={errors.title?.message}
            />

            <ListingPriceField
                label="Price (₹)"
                error={errors.price?.message}
                registerProps={register("price", { valueAsNumber: true })}
            />

            <PostSparePartDescriptionField
                register={register("description")}
                error={errors.description?.message}
            />
        </GenericPostForm>
    );
}
