"use client";

import { useEffect, useRef, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@esparex/ui";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FormError } from "@/components/ui/FormError";
import LocationSelector from "@/components/location/LocationSelector";
import type { Location } from "@/lib/api/user/locations";
import type { Category } from "@/lib/api/user/categories";
import { getCategories } from "@/lib/api/user/categories";
import { Bell, Check } from "@/icons/IconRegistry";
import { DeliveryChannelsSelector } from "./DeliveryChannelsSelector";
import { LocationRadiusSlider } from "./LocationRadiusSlider";
import { SmartAlertCategoryBrandModelFields } from "./SmartAlertCategoryBrandModelFields";
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
        let active = true;
        const load = async () => {
            if (active) setIsLoadingCategories(true);
            try {
                const res = await getCategories();
                if (active) setCategories(res);
            } catch {
                if (active) setCategories([]);
            } finally {
                if (active) setIsLoadingCategories(false);
            }
        };
        void load();
        return () => { active = false; };
    }, [open]);

    // Fetch brands when category changes
    useEffect(() => {
        const catObj = categories.find((c) => c.name === formData.category || c.slug === formData.category || c.id === formData.category);
        const catId = catObj?.id;
        let active = true;
        const load = async () => {
            if (!catId) {
                if (active) { setBrands([]); setModels([]); }
                return;
            }
            if (active) setIsLoadingBrands(true);
            try {
                const res = await getBrands(catId);
                if (active) setBrands(res);
            } catch {
                if (active) setBrands([]);
            } finally {
                if (active) setIsLoadingBrands(false);
            }
        };
        void load();
        return () => { active = false; };
    }, [formData.category, categories]);

    // Fetch models when brand changes
    useEffect(() => {
        const brandObj = brands.find((b) => b.name === formData.brand || b.id === formData.brand);
        const brandId = brandObj?.id || brandObj?._id;
        let active = true;
        const load = async () => {
            if (!brandId) {
                if (active) setModels([]);
                return;
            }
            if (active) setIsLoadingModels(true);
            try {
                const res = await getModels(brandId);
                if (active) setModels(res);
            } catch {
                if (active) setModels([]);
            } finally {
                if (active) setIsLoadingModels(false);
            }
        };
        void load();
        return () => { active = false; };
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
            <DialogContent className="max-w-md sm:max-w-[480px] w-[94vw] max-h-[min(720px,90vh)] flex flex-col rounded-3xl p-5 sm:p-6 gap-0 shadow-2xl overflow-hidden max-sm:rounded-b-3xl">
                {/* Fixed Header */}
                <DialogHeader className="space-y-1 text-left pb-3 border-b border-border shrink-0">
                    <DialogTitle className="flex items-center gap-2.5 text-body sm:text-headline font-bold">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                            <Bell className="h-4 w-4" />
                        </div>
                        <span>{isEditing ? "Edit Smart Alert" : "Create Smart Alert"}</span>
                    </DialogTitle>
                    <DialogDescription className="text-caption text-foreground-subtle leading-relaxed">
                        Set search criteria to receive real-time notifications for matching ads.
                    </DialogDescription>
                </DialogHeader>

                {/* Scrollable Form Body */}
                <form
                    onSubmit={async (e) => {
                        e.preventDefault();
                        await onSubmit(selectedLocation);
                    }}
                    className="flex flex-col flex-1 min-h-0"
                >
                    <div className="flex-1 overflow-y-auto min-h-0 space-y-4 py-4 pr-4 sm:pr-5 overscroll-contain">
                        {/* Category, Brand, Model Sub-Module */}
                        <SmartAlertCategoryBrandModelFields
                            categories={categories}
                            brands={brands}
                            models={models}
                            isLoadingCategories={isLoadingCategories}
                            isLoadingBrands={isLoadingBrands}
                            isLoadingModels={isLoadingModels}
                            formData={formData}
                            updateFormData={updateFormData}
                            errors={errors}
                        />

                        {/* Search Keywords */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <Label htmlFor="alert-keywords" className="text-caption font-semibold text-foreground">
                                    Search Keywords {!formData.model && <span className="text-destructive">*</span>}
                                </Label>
                                <span className="text-tiny font-medium text-foreground-subtle">
                                    {(formData.keywords || "").length}/150
                                </span>
                            </div>
                            <Input
                                id="alert-keywords"
                                disabled={Boolean(formData.model)}
                                placeholder={
                                    formData.model
                                        ? "Derived from selected Model"
                                        : "Enter keywords (e.g., LED TV 55, OLED)"
                                }
                                className="h-10.5 rounded-xl text-body border-border shadow-2xs focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary disabled:bg-muted/50 disabled:text-muted-foreground/60 disabled:cursor-not-allowed"
                                value={formData.keywords || ""}
                                maxLength={150}
                                onChange={(e) => updateFormData({ keywords: e.target.value })}
                            />
                            <FormError message={errors?.keywords} />
                        </div>

                        {/* Location */}
                        <div ref={locationWrapperRef} onFocusCapture={handleLocationFocus}>
                            <Label htmlFor="alert-location" className="text-caption font-semibold text-foreground mb-1.5 block">
                                Location <span className="text-destructive">*</span>
                            </Label>
                            <LocationSelector
                                variant="inline"
                                currentDisplay={formData.location || undefined}
                                onLocationSelect={handleLocationSelect}
                            />
                            <FormError message={errors?.location} />
                        </div>

                        {/* Location Radius */}
                        <div ref={radiusRef}>
                            <LocationRadiusSlider
                                value={formData.radiusKm}
                                onChange={(km) => updateFormData({ radiusKm: km })}
                                error={errors?.radiusKm}
                            />
                        </div>

                        {/* Delivery Channels Sub-Module */}
                        <DeliveryChannelsSelector
                            value={formData.notificationChannels}
                            onChange={(channels) => updateFormData({ notificationChannels: channels })}
                            error={errors?.notificationChannels}
                        />

                        {globalError && <FormError message={globalError} />}
                    </div>

                    {/* Fixed Footer Outside Scroll Area */}
                    <DialogFooter className="!mt-0 shrink-0 pt-3.5 border-t border-border/80 bg-card flex items-center gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onCancel}
                            disabled={isMutating}
                            className="flex-1 h-10 rounded-xl text-caption font-semibold cursor-pointer"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isMutating}
                            className="flex-1 h-10 bg-primary hover:bg-primary/90 text-primary-foreground text-caption font-bold rounded-xl shadow-md cursor-pointer"
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
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
