"use client";

import { useEffect, useRef, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@esparex/ui";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FormError } from "@/components/ui/FormError";
import LocationSelector from "@/components/location/LocationSelector";
import type { Location } from "@/lib/api/user/locations";
import type { Category } from "@/lib/api/user/categories";
import { getCategories } from "@/lib/api/user/categories";
import { getBrands, getModels, type Brand, type DeviceModel } from "@/lib/api/user/masterData";
import { Bell, Check } from "@/icons/IconRegistry";
import type { SmartAlertFieldErrors, SmartAlertFormData } from "../types";

type SmartAlertLocationSelection = Pick<
    Location,
    "id" | "locationId" | "name" | "display" | "city" | "coordinates"
>;

interface CreateSmartAlertDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    formData: SmartAlertFormData;
    updateFormData: (updates: Partial<SmartAlertFormData>) => void;
    onSubmit: (location: SmartAlertLocationSelection | null) => Promise<void>;
    onCancel: () => void;
    isEditing: boolean;
    isMutating?: boolean;
    errors?: SmartAlertFieldErrors;
    globalError?: string | null;
}

export function CreateSmartAlertDialog({
    open,
    onOpenChange,
    formData,
    updateFormData,
    onSubmit,
    onCancel,
    isEditing,
    isMutating,
    errors,
    globalError,
}: CreateSmartAlertDialogProps) {
    const [selectedLocation, setSelectedLocation] = useState<SmartAlertLocationSelection | null>(null);
    const radiusRef = useRef<HTMLDivElement>(null);
    const locationWrapperRef = useRef<HTMLDivElement>(null);

    // Catalog states
    const [categories, setCategories] = useState<Category[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [models, setModels] = useState<DeviceModel[]>([]);
    const [isLoadingCategories, setIsLoadingCategories] = useState(false);
    const [isLoadingBrands, setIsLoadingBrands] = useState(false);
    const [isLoadingModels, setIsLoadingModels] = useState(false);

    // Fetch categories on mount
    useEffect(() => {
        if (!open) return;
        setIsLoadingCategories(true);
        getCategories()
            .then(setCategories)
            .catch(() => setCategories([]))
            .finally(() => setIsLoadingCategories(false));
    }, [open]);

    // Fetch brands when category changes
    useEffect(() => {
        const catObj = categories.find(
            (c) => c.name === formData.category || c.slug === formData.category || c.id === formData.category
        );
        const catId = catObj?.id;
        if (!catId) {
            setBrands([]);
            setModels([]);
            return;
        }

        setIsLoadingBrands(true);
        getBrands(catId)
            .then(setBrands)
            .catch(() => setBrands([]))
            .finally(() => setIsLoadingBrands(false));
    }, [formData.category, categories]);

    // Fetch models when brand changes
    useEffect(() => {
        const brandObj = brands.find((b) => b.name === formData.brand || b.id === formData.brand);
        const brandId = brandObj?.id || brandObj?._id;
        if (!brandId) {
            setModels([]);
            return;
        }

        setIsLoadingModels(true);
        getModels(brandId)
            .then(setModels)
            .catch(() => setModels([]))
            .finally(() => setIsLoadingModels(false));
    }, [formData.brand, brands]);

    const handleLocationSelect = (loc: Location | null) => {
        if (!loc?.coordinates) {
            setSelectedLocation(null);
            updateFormData({ location: "", locationId: null });
            return;
        }

        setSelectedLocation({
            id: loc.id,
            locationId: loc.locationId,
            name: loc.name,
            display: loc.display,
            city: loc.city,
            coordinates: loc.coordinates,
        });
        updateFormData({
            location: loc.display || loc.name || loc.city || "",
            locationId: loc.locationId || loc.id || null,
        });

        // Auto-scroll down to radius selection after location selection
        setTimeout(() => {
            radiusRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }, 120);
    };

    const handleLocationFocus = () => {
        setTimeout(() => {
            locationWrapperRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-sm sm:max-w-[400px] w-[94vw] h-[92dvh] sm:h-[88dvh] max-h-[680px] flex flex-col rounded-3xl p-4 sm:p-5 gap-0 shadow-2xl max-sm:rounded-b-3xl">
                <DialogHeader className="space-y-1 text-left pb-2.5 border-b border-border shrink-0">
                    <DialogTitle className="flex items-center gap-2 text-body-lg font-bold">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <Bell className="h-4 w-4" />
                        </div>
                        <span>{isEditing ? "Edit Smart Alert" : "Create Smart Alert"}</span>
                    </DialogTitle>
                    <DialogDescription className="text-caption text-foreground-subtle">
                        {isEditing
                            ? "Update criteria to refine instant alert matching."
                            : "Set criteria to get instant notifications when matching items are posted."}
                    </DialogDescription>
                </DialogHeader>

                {/* Main Form Area */}
                <form
                    onSubmit={async (e) => {
                        e.preventDefault();
                        await onSubmit(selectedLocation);
                    }}
                    className="flex flex-col flex-1 min-h-0 pt-3"
                >
                    <div className="flex-1 overflow-y-auto space-y-3 px-1 py-0.5">
                        {/* Category (SSOT) */}
                        <div>
                            <Label htmlFor="alert-category" className="text-caption font-semibold text-foreground">
                                Category <span className="text-destructive">*</span>
                            </Label>
                            <select
                                id="alert-category"
                                value={formData.category}
                                onChange={(e) => updateFormData({ category: e.target.value, brand: "", model: "" })}
                                className="mt-1 w-full h-10 rounded-xl border border-border bg-card px-3 pr-8 text-caption font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary truncate"
                                disabled={isLoadingCategories}
                            >
                                <option value="">Select Category...</option>
                                {categories.map((c) => (
                                    <option key={c.id || c.slug} value={c.name}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                            <FormError message={errors?.category} />
                        </div>

                        {/* Brand (Optional SSOT) */}
                        <div>
                            <Label htmlFor="alert-brand" className="text-caption font-semibold text-foreground">
                                Brand <span className="text-foreground-subtle font-normal">(Optional)</span>
                            </Label>
                            <select
                                id="alert-brand"
                                value={formData.brand || ""}
                                onChange={(e) => updateFormData({ brand: e.target.value, model: "" })}
                                className="mt-1 w-full h-10 rounded-xl border border-border bg-card px-3 pr-8 text-caption font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary truncate"
                                disabled={!formData.category || isLoadingBrands}
                            >
                                <option value="">All Brands (Optional)</option>
                                {brands.map((b) => (
                                    <option key={b.id || b._id} value={b.name}>
                                        {b.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Model (Optional SSOT) */}
                        <div>
                            <Label htmlFor="alert-model" className="text-caption font-semibold text-foreground">
                                Model <span className="text-foreground-subtle font-normal">(Optional)</span>
                            </Label>
                            <select
                                id="alert-model"
                                value={formData.model || ""}
                                onChange={(e) => updateFormData({ model: e.target.value })}
                                className="mt-1 w-full h-10 rounded-xl border border-border bg-card px-3 pr-8 text-caption font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary truncate"
                                disabled={!formData.brand || isLoadingModels}
                            >
                                <option value="">All Models (Optional)</option>
                                {models.map((m) => (
                                    <option key={m.id || m._id} value={m.name}>
                                        {m.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Search Keywords (Optional Fallback) */}
                        <div>
                            <div className="flex items-center justify-between">
                                <Label htmlFor="alert-keywords" className="text-caption font-semibold text-foreground">
                                    Search Keywords <span className="text-foreground-subtle font-normal">(Optional Fallback)</span>
                                </Label>
                                <span className="text-tiny text-foreground-subtle">
                                    {(formData.keywords || "").length}/150
                                </span>
                            </div>
                            <Input
                                id="alert-keywords"
                                placeholder="e.g., iPhone 16 Air, Galaxy S26, A3298"
                                className="mt-1 h-10 rounded-xl text-caption"
                                value={formData.keywords || ""}
                                maxLength={150}
                                onChange={(e) => updateFormData({ keywords: e.target.value })}
                            />
                            <FormError message={errors?.keywords} />
                        </div>

                        {/* Location (LocationSelector SSOT) */}
                        <div ref={locationWrapperRef} onFocusCapture={handleLocationFocus}>
                            <Label htmlFor="alert-location" className="text-caption font-semibold text-foreground">
                                Location <span className="text-destructive">*</span>
                            </Label>
                            <div className="mt-1">
                                <LocationSelector
                                    variant="inline"
                                    currentDisplay={formData.location || undefined}
                                    onLocationSelect={handleLocationSelect}
                                />
                            </div>
                            <FormError message={errors?.location} />
                        </div>

                        {/* Location Radius Scroller */}
                        <div ref={radiusRef} className="pt-0.5">
                            <div className="flex items-center justify-between mb-1">
                                <Label htmlFor="alert-radius" className="text-tiny font-semibold text-foreground">Location Radius</Label>
                                <span className="text-caption font-bold text-primary">{formData.radiusKm} km</span>
                            </div>
                            <input
                                id="alert-radius"
                                name="alert-radius"
                                type="range"
                                min="5"
                                max="500"
                                value={formData.radiusKm}
                                onChange={(e) => updateFormData({ radiusKm: parseInt(e.target.value, 10) || 5 })}
                                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                            />
                            <div className="flex items-center justify-between text-tiny font-medium text-foreground-subtle mt-0.5">
                                <span>5 km</span>
                                <span>500 km</span>
                            </div>
                            <FormError message={errors?.radiusKm} />
                        </div>

                        {globalError && <FormError message={globalError} />}
                    </div>

                    {/* PINNED STICKY CTA FOOTER (Always visible without scrolling) */}
                    <div className="sticky bottom-0 bg-card pt-3 pb-0 border-t border-border mt-2 flex items-center gap-2 shrink-0 z-10">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onCancel}
                            disabled={isMutating}
                            className="flex-1 h-11 rounded-xl text-caption font-semibold"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isMutating}
                            className="flex-1 h-11 bg-primary hover:bg-primary/90 text-primary-foreground text-caption font-bold rounded-xl shadow-md"
                        >
                            {isMutating ? (
                                "Saving..."
                            ) : (
                                <>
                                    <Check className="mr-1.5 h-4 w-4" />
                                    {isEditing ? "Save Changes" : "Create Alert"}
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
