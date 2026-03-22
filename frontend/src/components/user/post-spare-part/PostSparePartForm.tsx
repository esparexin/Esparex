"use client";

import React from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/ui/field";
import { cn } from "@/components/ui/utils";
import { Loader2, Upload, X, Check, CircuitBoard, MapPin } from "@/icons/IconRegistry";
import { BrandSearchSelect } from "@/components/user/BrandSearchSelect";
import { useAuth } from "@/context/AuthContext";
import { useBusiness } from "@/hooks/useBusiness";
import { useListingCatalog } from "@/hooks/listings/useListingCatalog";
import { createSparePartListing, getSparePartListingDetail, updateSparePartListing } from "@/api/user/sparePartListings";
import { useListingSubmission } from "@/hooks/listings/useListingSubmission";
import type { ListingImage } from "@/types/listing";
import { PostSparePartFormSchema, type PostSparePartFormValues } from "@/schemas/postSparePartForm.schema";

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
            sparePartId: "",
            price: 0,
            description: "",
        },
    });

    const { register, watch, setValue, handleSubmit, formState: { errors } } = form;
    const categoryId = watch("categoryId");
    const sparePartId = watch("sparePartId");

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
        if (businessData?.location && !editSparePartId) {
            const loc = businessData.location;
            form.setValue("location", {
                city: loc.city || "",
                state: loc.state || "",
                display: loc.display || [loc.city, loc.state].filter(Boolean).join(", "),
                coordinates: loc.coordinates || { type: "Point", coordinates: [0, 0] },
                locationId: loc.locationId,
            });
        }
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
                const payload = await getSparePartListingDetail(editSparePartId);
                if (isMounted && payload) {
                    form.reset({
                        title: payload.title || "",
                        categoryId: typeof payload.categoryId === 'string' ? payload.categoryId : payload.categoryId?.id || "",
                        brandId: payload.brandId || "",
                        sparePartId: typeof payload.sparePartId === 'string' ? payload.sparePartId : payload.sparePartId?.id || "",
                        price: payload.price || 0,
                        description: payload.description || "",
                        location: payload.location as any
                    });

                    if (payload.images && Array.isArray(payload.images)) {
                        setImages(payload.images.map(url => ({
                            id: Math.random().toString(36).substring(7),
                            preview: url,
                            file: null as any,
                            isRemote: true
                        })));
                    }
                }
            } catch (e) {
                console.error("Failed to load spare part", e);
            } finally {
                if (isMounted) setIsFetchingData(false);
            }
        };
        loadListing();
        return () => { isMounted = false; };
    }, [editSparePartId, form]);
    const handleImageUpload = (files: File[]) => {
        const newImgs: ListingImage[] = files.map(f => ({
            id: `${f.name}-${Date.now()}`,
            file: f,
            preview: URL.createObjectURL(f),
            isRemote: false,
        }));
        setImages(prev => [...prev, ...newImgs].slice(0, 10));
    };
    const removeImage = (id: string) => setImages(prev => prev.filter(i => i.id !== id));

    // ─── Handlers ─────────────────────────────────────────────────────────
    const handleCategorySelect = async (id: string) => {
        setValue("categoryId", id);
        setValue("brandId", "");
        setValue("sparePartId", "");
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
            // Also hoist locationId to top-level — backend controller requires it there
            return createSparePartListing({
                categoryId: payload.categoryId,
                sparePartId: payload.sparePartId,
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
        onSuccess: () => router.push(isEditMode ? "/my-ads?tab=pending" : "/post-spare-part-success"),
        onError: (msg) => setFormError(msg),
    });

    const locationDisplay = businessData?.location?.display ||
        [businessData?.location?.city, businessData?.location?.state].filter(Boolean).join(", ");

    if (isFetchingData) {
        return (
            <div
                className="fixed inset-0 z-[1001] flex flex-col bg-white overflow-hidden font-inter
                           sm:bg-slate-900/40 sm:backdrop-blur-md
                           sm:items-center sm:justify-center sm:p-6"
            >
                <div
                    className="flex flex-col bg-white flex-1 overflow-hidden sm:flex-none sm:w-full
                               sm:max-w-lg sm:max-h-[90dvh] sm:rounded-2xl sm:shadow-2xl sm:border sm:border-slate-900/10"
                >
                    <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
                        Loading spare part details...
                    </div>
                </div>
            </div>
        );
    }

    // ─── Render ──────────────────────────────────────────────────────────
    return (
        <FormProvider {...form}>
            {/* Overlay — full-screen mobile, centred modal on desktop */}
            <div
                onClick={() => router.back()}
                className="fixed inset-0 z-[1001] flex flex-col bg-white overflow-hidden font-inter
                           sm:bg-slate-900/40 sm:backdrop-blur-md
                           sm:items-center sm:justify-center sm:p-6 sm:cursor-pointer"
            >
                {/* Modal card */}
                <div
                    onClick={e => e.stopPropagation()}
                    className="flex flex-col bg-white flex-1 overflow-hidden sm:cursor-default
                               sm:flex-none sm:w-full sm:max-w-lg sm:max-h-[90dvh]
                               sm:rounded-2xl sm:shadow-2xl sm:border sm:border-slate-900/10"
                >
                    {/* Header — X left, title centred mobile / left desktop */}
                    <header className="shrink-0 bg-white border-b border-slate-200 flex items-center px-4 h-14 sm:gap-3 sm:px-5 sm:h-auto sm:py-4">
                        <div className="sm:contents flex items-center w-full">
                            <div className="w-10 sm:w-auto flex items-center justify-start shrink-0">
                                <button
                                    type="button"
                                    onClick={() => router.back()}
                                    aria-label="Close"
                                    className="h-9 w-9 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <h1 className="font-bold text-slate-900 text-base leading-none flex-1 text-center sm:flex-none sm:text-left">
                                {isEditMode ? "Edit Spare Part" : "Post Spare Part"}
                            </h1>
                            {/* Spacer to centre title on mobile only */}
                            <div className="w-10 sm:hidden" />
                        </div>
                    </header>

                    {/* Scrollable body */}
                    <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">
                        <form id="post-spare-part-form" onSubmit={handleSubmit(onValidSubmit)} className="space-y-6">

                            {formError && (
                                <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm border border-red-100 font-medium">
                                    {formError}
                                </div>
                            )}

                            {/* Category */}
                            <section className="space-y-3">
                                <Field label="Select Category" error={errors.categoryId?.message}>
                                    <div className="grid grid-cols-4 gap-2">
                                        {dynamicCategories.map(cat => {
                                            const Icon = cat.icon || CircuitBoard;
                                            const selected = cat.id === categoryId;
                                            return (
                                                <button
                                                    key={cat.id}
                                                    type="button"
                                                    onClick={() => handleCategorySelect(cat.id || "")}
                                                    disabled={isEditMode}
                                                    className={cn(
                                                        "flex flex-col items-center gap-1 py-3 px-1 rounded-xl border-2 transition-all text-center",
                                                        selected
                                                            ? "bg-primary border-primary text-white"
                                                            : "bg-white border-slate-100 text-slate-600 hover:border-slate-200",
                                                        isEditMode && !selected ? "opacity-40" : ""
                                                    )}
                                                >
                                                    <Icon className={cn("w-5 h-5", selected ? "text-white" : "text-slate-400")} />
                                                    <span className="text-[10px] font-bold leading-tight truncate w-full px-1">{cat.name}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
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
                                    <Field label="Spare Part" error={errors.sparePartId?.message}>
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
                                                    const selected = sparePartId === id;
                                                    return (
                                                        <button
                                                            key={id}
                                                            type="button"
                                                            onClick={() => setValue("sparePartId", id, { shouldValidate: true })}
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
                            <Field label="Part Title" error={errors.title?.message}>
                                <div className="relative">
                                    <Input
                                        {...register("title")}
                                        placeholder="e.g. iPhone 14 OEM Display Screen"
                                        className="h-12 rounded-xl border-2 border-slate-200 bg-white text-sm font-medium focus:border-primary pr-16"
                                    />
                                    <span className={cn(
                                        "absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-medium tabular-nums pointer-events-none",
                                        (watch("title") || "").length > 55 ? "text-red-400" : "text-slate-400"
                                    )}>
                                        {(watch("title") || "").length}/60
                                    </span>
                                </div>
                            </Field>

                            {/* Price */}
                            <Field label="Price (₹)" error={errors.price?.message}>
                                <Input
                                    type="number"
                                    {...register("price", { valueAsNumber: true })}
                                    placeholder="0"
                                    min={0}
                                    className="h-12 rounded-xl border-2 border-slate-200 bg-white text-sm font-medium focus:border-primary"
                                />
                            </Field>

                            {/* Description */}
                            <Field label="Description" error={errors.description?.message}>
                                <div className="relative">
                                    <Textarea
                                        {...register("description")}
                                        placeholder="Describe origin, quality, compatibility notes..."
                                        className="min-h-[120px] rounded-xl border-2 border-slate-200 bg-white text-sm pb-6"
                                    />
                                    <span className={cn(
                                        "absolute right-3 bottom-2 text-[11px] font-medium tabular-nums pointer-events-none",
                                        (watch("description") || "").length > 1900 ? "text-red-400" : "text-slate-400"
                                    )}>
                                        {(watch("description") || "").length}/2000
                                    </span>
                                </div>
                            </Field>

                            {/* Images */}
                            <Field label="Photos (up to 10)">
                                <div className="space-y-3">
                                    <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                                        <Upload className="w-6 h-6 text-slate-400 mb-1" />
                                        <span className="text-xs text-slate-500">Tap to add photos</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            className="hidden"
                                            onChange={e => {
                                                if (e.target.files) {
                                                    handleImageUpload(Array.from(e.target.files));
                                                    e.target.value = "";
                                                }
                                            }}
                                        />
                                    </label>
                                    {images.length > 0 && (
                                        <div className="grid grid-cols-4 gap-2">
                                            {images.map((img, i) => (
                                                <div key={img.id} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-100 group">
                                                    <Image
                                                        src={img.preview}
                                                        alt={`Photo ${i + 1}`}
                                                        fill
                                                        unoptimized
                                                        sizes="25vw"
                                                        className="object-cover"
                                                    />
                                                    {i === 0 && (
                                                        <span className="absolute bottom-0 left-0 right-0 text-center text-[9px] font-bold bg-primary text-white py-0.5">MAIN</span>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => removeImage(img.id)}
                                                        className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white rounded-full flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </Field>

                            {/* Location (read-only from business) */}
                            <Field label="Listing Location">
                                <div className="flex items-center gap-2 h-12 px-3 rounded-xl border-2 border-slate-100 bg-slate-50 text-sm text-slate-700">
                                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                                    <span className="truncate">{form.watch("location.display") || locationDisplay || "Loading business location..."}</span>
                                    <span className="ml-auto text-[10px] text-slate-500 bg-slate-200 px-2 py-0.5 rounded uppercase font-bold shrink-0">Fixed Address</span>
                                </div>
                            </Field>

                        </form>
                    </div>

                    {/* Footer — inside modal card, NOT viewport-fixed */}
                    <footer className="shrink-0 bg-white border-t border-slate-100 p-4 sm:px-5 sm:py-4">
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
                    </footer>
                </div>
            </div>
        </FormProvider>
    );
}
