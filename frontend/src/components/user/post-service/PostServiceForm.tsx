"use client";

import React from "react";
import logger from "@/lib/logger";
import Image from "next/image";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
    ServiceListingPayloadSchema,
    type ServiceListingFormData,
} from "@/schemas/serviceListingPayload.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/ui/field";
import { cn } from "@/components/ui/utils";
import { Loader2, Upload, X, Check, Wrench, MapPin } from "@/icons/IconRegistry";
import { BrandSearchSelect } from "@/components/user/BrandSearchSelect";
import { useAuth } from "@/context/AuthContext";
import { useBusiness } from "@/hooks/useBusiness";
import { useListingCatalog } from "@/hooks/listings/useListingCatalog";
import { useListingSubmission } from "@/hooks/listings/useListingSubmission";
import { createService, getServiceById, updateService } from "@/api/user/services";
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
            priceMin: 0,
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
        if (businessData?.location && !editServiceId) {
            const loc = businessData.location;
            setValue("location", {
                city: loc.city || "",
                state: loc.state || "",
                display: loc.display || [loc.city, loc.state].filter(Boolean).join(", "),
                coordinates: loc.coordinates || { type: "Point", coordinates: [0, 0] },
                locationId: loc.locationId,
            });
        }
    }, [businessData, editServiceId, setValue]);

    // ─── Images ────────────────────────────────────────────────────────────
    const [images, setImages] = React.useState<ListingImage[]>([]);
    const [isFetchingData, setIsFetchingData] = React.useState(!!editServiceId);

    const extractEntityId = React.useCallback((value: unknown): string => {
        if (typeof value === "string") return value;
        if (value && typeof value === "object") {
            const record = value as Record<string, unknown>;
            const candidate = record.id || record._id;
            if (typeof candidate === "string") return candidate;
        }
        return "";
    }, []);

    const normalizeServiceTypeTokens = React.useCallback((value: unknown): string[] => {
        if (!Array.isArray(value)) return [];
        return value
            .map((entry) => {
                if (typeof entry === "string") return entry.trim();
                if (entry && typeof entry === "object") return extractEntityId(entry).trim();
                return "";
            })
            .filter((token) => token.length > 0);
    }, [extractEntityId]);

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
                const payload = await getServiceById(editServiceId);
                if (isMounted && payload) {
                    const categoryId = extractEntityId(payload.category || payload.categoryId);
                    const brandId = extractEntityId(payload.brand || payload.brandId);
                    const serviceTypeTokens = normalizeServiceTypeTokens(payload.serviceTypeIds || payload.serviceTypes);
                    form.reset({
                        title: payload.title || "",
                        categoryId,
                        brandId,
                        serviceTypeIds: serviceTypeTokens,
                        priceMin: payload.priceMin || payload.price || 0,
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
                        setImages(payload.images.map(url => ({
                            id: Math.random().toString(36).substring(7),
                            preview: url,
                            file: null as any,
                            isRemote: true,
                        })));
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
    }, [editServiceId, extractEntityId, form, loadBrandsForCategory, loadServiceTypes, normalizeServiceTypeTokens, resolveServiceTypeIds, setValue]);

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
        [businessData?.location?.city, businessData?.location?.state].filter(Boolean).join(", ");

    if (isFetchingData) {
        return (
            <div className="fixed inset-0 z-[1001] flex items-center justify-center bg-white">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
        );
    }

    // ─── Render — PostAd-identical shell ──────────────────────────────────
    return (
        <FormProvider {...form}>
            {/* Overlay wrapper — full-screen mobile, centred modal on desktop */}
            <div
                onClick={() => router.back()}
                className={cn(
                    "fixed inset-0 z-[1001] flex flex-col bg-white overflow-hidden font-inter",
                    "sm:bg-slate-900/40 sm:backdrop-blur-md",
                    "sm:items-center sm:justify-center sm:p-6 sm:cursor-pointer"
                )}
            >
                {/* Modal card */}
                <div
                    onClick={e => e.stopPropagation()}
                    className={cn(
                        "flex flex-col bg-white flex-1 overflow-hidden sm:cursor-default",
                        "sm:flex-none sm:w-full sm:max-w-lg sm:max-h-[90dvh]",
                        "sm:rounded-2xl sm:shadow-2xl sm:border sm:border-slate-900/10"
                    )}
                >
                    {/* ── Header ── */}
                    <header className={cn(
                        "shrink-0 bg-white border-b border-slate-200",
                        "flex items-center px-4 h-14",
                        "sm:gap-3 sm:px-5 sm:h-auto sm:py-4"
                    )}>
                        <div className="flex items-center w-full sm:contents">
                            {/* X / close */}
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
                            {/* Title — centred on mobile, left-aligned on desktop */}
                            <h1 className={cn(
                                "font-bold text-slate-900 text-base leading-none",
                                "flex-1 text-center",
                                "sm:flex-none sm:text-left"
                            )}>
                                {isEditMode ? "Edit Service" : "Post a Service"}
                            </h1>
                            {/* Right spacer keeps title centred on mobile */}
                            <div className="w-10 sm:hidden" />
                        </div>
                    </header>

                    {/* ── Scrollable body ── */}
                    <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">
                        <form
                            id="post-service-form"
                            onSubmit={handleSubmit(onValidSubmit)}
                            className="space-y-8"
                        >
                            {/* Category */}
                            <Field label="Select Category" error={errors.categoryId?.message}>
                                <div className="grid grid-cols-4 gap-2">
                                    {dynamicCategories.map(cat => {
                                        const Icon = cat.icon || Wrench;
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
                                                <span className="text-[10px] font-bold leading-tight truncate w-full px-1">
                                                    {cat.name}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
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
                            <Field label="Service Title" error={errors.title?.message}>
                                <div className="relative">
                                    <Input
                                        {...register("title")}
                                        placeholder="e.g. iPhone Screen Replacement"
                                        className="h-12 rounded-xl border-2 border-slate-200 bg-white text-sm font-medium focus:border-primary pr-16"
                                    />
                                    <span className={cn(
                                        "absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-medium tabular-nums pointer-events-none",
                                        titleVal.length > 55 ? "text-red-400" : "text-slate-400"
                                    )}>
                                        {titleVal.length}/60
                                    </span>
                                </div>
                            </Field>

                            {/* Price */}
                            <Field label="Price (₹)" error={errors.priceMin?.message}>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm pointer-events-none">₹</span>
                                    <Input
                                        type="number"
                                        {...register("priceMin", { valueAsNumber: true })}
                                        placeholder="0"
                                        min={0}
                                        className="h-12 rounded-xl border-2 border-slate-200 bg-white text-sm font-medium focus:border-primary pl-8"
                                    />
                                </div>
                            </Field>

                            {/* Description */}
                            <Field label="Description" error={errors.description?.message}>
                                <div className="relative">
                                    <Textarea
                                        {...register("description")}
                                        placeholder="Describe your service: what's included, turnaround time, warranty..."
                                        className="min-h-[120px] rounded-xl border-2 border-slate-200 bg-white text-sm pb-6"
                                    />
                                    <span className={cn(
                                        "absolute right-3 bottom-2 text-[11px] font-medium tabular-nums pointer-events-none",
                                        descVal.length > 1900 ? "text-red-400" : "text-slate-400"
                                    )}>
                                        {descVal.length}/2000
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
                                                <div
                                                    key={img.id}
                                                    className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-100 group"
                                                >
                                                    <Image
                                                        src={img.preview}
                                                        alt={`Photo ${i + 1}`}
                                                        fill
                                                        unoptimized
                                                        sizes="25vw"
                                                        className="object-cover"
                                                    />
                                                    {i === 0 && (
                                                        <span className="absolute bottom-0 left-0 right-0 text-center text-[9px] font-bold bg-primary text-white py-0.5">
                                                            COVER
                                                        </span>
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
                                {locationDisplay ? (
                                    <div className="flex items-center gap-2 h-12 px-3 rounded-xl border-2 border-slate-100 bg-slate-50 text-sm text-slate-700">
                                        <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                                        <span className="truncate">{locationDisplay}</span>
                                        <span className="ml-auto text-[10px] text-slate-500 bg-slate-200 px-2 py-0.5 rounded uppercase font-bold shrink-0">
                                            Fixed
                                        </span>
                                    </div>
                                ) : (
                                    <div className="h-12 rounded-xl bg-slate-100 animate-pulse" />
                                )}
                            </Field>

                        </form>
                    </div>

                    {/* ── Footer (within modal, not viewport-fixed) ── */}
                    <footer className="shrink-0 bg-white border-t border-slate-100 p-4 sm:px-5 sm:py-4">
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
                    </footer>
                </div>
            </div>
        </FormProvider>
    );
}
