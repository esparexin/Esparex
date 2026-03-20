"use client";

import React from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/ui/field";
import { cn } from "@/components/ui/utils";
import { Loader2, Upload, X, Check, CircuitBoard, MapPin } from "@/icons/IconRegistry";
import { useAuth } from "@/context/AuthContext";
import { useBusiness } from "@/hooks/useBusiness";
import { useListingCatalog } from "@/hooks/listings/useListingCatalog";
import { createAd } from "@/api/user/ads";
import type { ListingImage } from "@/types/listing";

// ─── Schema ─────────────────────────────────────────────────────────────────
const PostSparePartSchema = z.object({
    title: z.string().min(10, "Title must be at least 10 characters").max(60, "Title too long"),
    categoryId: z.string().min(1, "Please select a category"),
    brandId: z.string().optional(),
    sparePartTypeId: z.string().min(1, "Please select a spare part type"),
    price: z.number({ invalid_type_error: "Enter a valid price" }).min(0, "Price must be at least 0"),
    description: z.string().min(20, "Description must be at least 20 characters").max(2000, "Description too long"),
    location: z.object({
        city: z.string(),
        state: z.string(),
        display: z.string(),
        coordinates: z.object({
            type: z.literal("Point"),
            coordinates: z.tuple([z.number(), z.number()]),
        }),
        locationId: z.string().optional(),
    }).optional(),
});

type PostSparePartValues = z.infer<typeof PostSparePartSchema>;

// ─── Component ───────────────────────────────────────────────────────────────
export default function PostSparePartForm() {
    const router = useRouter();
    const { user } = useAuth();
    const { businessData } = useBusiness(user);

    const form = useForm<PostSparePartValues>({
        resolver: zodResolver(PostSparePartSchema),
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
        availableSpareParts,
        loadSparePartsForCategory,
        isLoadingSpareParts,
    } = useListingCatalog({ listingType: "postsparepart" });

    // ─── Pre-fill location ─────────────────────────────────────────────────
    React.useEffect(() => {
        if (businessData?.location) {
            const loc = businessData.location;
            form.setValue("location", {
                city: loc.city || "",
                state: loc.state || "",
                display: loc.display || [loc.city, loc.state].filter(Boolean).join(", "),
                coordinates: loc.coordinates || { type: "Point", coordinates: [0, 0] },
                locationId: loc.locationId,
            });
        }
    }, [businessData, form]);

    // ─── Images (local) ────────────────────────────────────────────────────
    const [images, setImages] = React.useState<ListingImage[]>([]);
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
        setValue("sparePartTypeId", "");
        await loadSparePartsForCategory(id);
    };

    // ─── Submission ───────────────────────────────────────────────────────
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [formError, setFormError] = React.useState<string | null>(null);

    const onSubmit = async (data: PostSparePartValues) => {
        setIsSubmitting(true);
        setFormError(null);
        try {
            // Upload images first (convert previews to URLs — handled by createAd pipeline)
            const payload = {
                ...data,
                listingType: "spare_part" as const,
                attributes: {
                    sparePartTypeId: data.sparePartTypeId,
                },
            };
            await createAd(payload);
            router.push("/post-spare-part-success");
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Submission failed. Please try again.";
            setFormError(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const locationDisplay = businessData?.location?.display ||
        [businessData?.location?.city, businessData?.location?.state].filter(Boolean).join(", ");

    // ─── Render ──────────────────────────────────────────────────────────
    return (
        <FormProvider {...form}>
            <div className="min-h-screen bg-slate-50 pb-32">
                {/* Header */}
                <div className="sticky top-0 z-40 bg-white border-b border-slate-100 px-4 py-4 flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600"
                    >
                        <X className="w-4 h-4" />
                    </button>
                    <div>
                        <h1 className="text-base font-bold text-slate-900">Post Spare Part</h1>
                        <p className="text-xs text-slate-500">Fill in details · Submit for review</p>
                    </div>
                </div>

                <form id="post-spare-part-form" onSubmit={handleSubmit(onSubmit)} className="max-w-lg mx-auto px-4 pt-6 space-y-8">

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
                                            className={cn(
                                                "flex flex-col items-center gap-1 py-3 px-1 rounded-xl border-2 transition-all text-center",
                                                selected
                                                    ? "bg-primary border-primary text-white"
                                                    : "bg-white border-slate-100 text-slate-600 hover:border-slate-200"
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
                                                    className={cn(
                                                        "py-2.5 px-2 rounded-xl border text-xs font-bold transition-all",
                                                        selected
                                                            ? "bg-primary border-primary text-white shadow-sm"
                                                            : "bg-white border-slate-100 text-slate-600 hover:border-slate-200"
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
                        <Input
                            {...register("title")}
                            placeholder="e.g. iPhone 14 OEM Display Screen"
                            className="h-12 rounded-xl border-2 border-slate-200 bg-white text-sm font-medium focus:border-primary"
                        />
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
                        <Textarea
                            {...register("description")}
                            placeholder="Describe origin, quality, compatibility notes..."
                            className="min-h-[120px] rounded-xl border-2 border-slate-200 bg-white text-sm"
                        />
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
                                                className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
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
                            <span className="truncate">{locationDisplay || "Loading business location..."}</span>
                            <span className="ml-auto text-xs text-slate-400 shrink-0">(from business)</span>
                        </div>
                    </Field>

                </form>
            </div>

            {/* Sticky Submit */}
            <div className="fixed bottom-0 inset-x-0 z-50 bg-white border-t border-slate-100 p-4">
                <div className="max-w-lg mx-auto">
                    <Button
                        type="submit"
                        form="post-spare-part-form"
                        disabled={isSubmitting}
                        className="w-full h-14 rounded-2xl font-bold text-base bg-primary text-white shadow-lg disabled:opacity-70"
                    >
                        {isSubmitting ? (
                            <span className="flex items-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> Submitting...</span>
                        ) : "Submit Spare Part →"}
                    </Button>
                </div>
            </div>
        </FormProvider>
    );
}
