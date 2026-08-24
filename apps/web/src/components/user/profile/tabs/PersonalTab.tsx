"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { personalProfileSchema, type PersonalProfileValues, MOBILE_VISIBILITY } from "@esparex/contracts";

import { Button, Card, CardContent, Switch } from "@esparex/ui";
import { FormError } from "@/components/ui/FormError";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { User, Camera, Lock } from "@/icons/IconRegistry";
import { UploadSourcePicker } from "@/components/user/shared/UploadSourcePicker";

import { updateProfile } from "@/lib/api/user/users";
import { notify } from "@/lib/feedback";
import { toSafeImageSrc } from "@/lib/image/imageUrl";
import { isAllowedProfilePhotoType, PROFILE_PHOTO_ALLOWED_LABEL, PROFILE_PHOTO_MAX_BYTES, PROFILE_PHOTO_ACCEPT } from "@/lib/uploads/profilePhotoUpload";
import type { User as UserType } from "@/types/User";
import type { ProfileUser } from "../types";
import { PersonalProfileEmailSection } from "./PersonalProfileEmailSection";
import { PersonalProfileGstSection } from "./PersonalProfileGstSection";

interface PersonalTabProps {
    user: ProfileUser | null;
    onUpdateUser: (userData: UserType) => void;
}

export function PersonalTab({ user, onUpdateUser }: PersonalTabProps) {
    const safeProfilePhoto = toSafeImageSrc(user?.profilePhoto || null, "");

    const [isSaving, setIsSaving] = useState(false);
    const [globalError, setGlobalError] = useState<string | null>(null);

    // Photo state
    const [showPhotoDialog, setShowPhotoDialog] = useState(false);
    const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null);
    const [previewPhoto, setPreviewPhoto] = useState<string | null>(safeProfilePhoto);
    const [photoError, setPhotoError] = useState<string | undefined>(undefined);

    const cameraInputRef = useRef<HTMLInputElement>(null);
    const galleryInputRef = useRef<HTMLInputElement>(null);

    const handleCamera = () => {
        if (cameraInputRef.current) {
            cameraInputRef.current.value = "";
            cameraInputRef.current.click();
        }
    };

    const handleGallery = () => {
        if (galleryInputRef.current) {
            galleryInputRef.current.value = "";
            galleryInputRef.current.click();
        }
    };

    const form = useForm<PersonalProfileValues>({
        resolver: zodResolver(personalProfileSchema),
        defaultValues: {
            name: user?.name || "",
            email: user?.email || "",
            gstin: user?.gstin || "",
            mobileVisibility: (user?.mobileVisibility as 'show' | 'hide' | 'on_request') || MOBILE_VISIBILITY.SHOW,
        },
    });

    const onSubmit = async (data: PersonalProfileValues) => {
        setIsSaving(true);
        setGlobalError(null);

        try {
            const formData = new FormData();
            formData.append("name", data.name);
            formData.append("email", data.email || "");
            formData.append("gstin", data.gstin || "");
            formData.append("mobileVisibility", data.mobileVisibility);

            if (selectedPhotoFile) {
                formData.append("profilePhoto", selectedPhotoFile);
            }

            const updated = await updateProfile(formData);
            if (updated) {
                onUpdateUser(updated);
            }
            notify.success("Profile updated successfully");
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to update profile";
            setGlobalError(msg);
            notify.error(msg);
        } finally {
            setIsSaving(false);
        }
    };

    const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!isAllowedProfilePhotoType(file.type)) {
            setPhotoError(`Unsupported image format. Use ${PROFILE_PHOTO_ALLOWED_LABEL}.`);
            return;
        }

        if (file.size > PROFILE_PHOTO_MAX_BYTES) {
            setPhotoError("Image size must be less than 5MB.");
            return;
        }

        setSelectedPhotoFile(file);
        setPhotoError(undefined);
        setGlobalError(null);

        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewPhoto(reader.result as string);
            setShowPhotoDialog(false);
            notify.success("Photo selected! Click 'Save changes' to upload.");
        };
        reader.readAsDataURL(file);
    };

    const handlePhotoDelete = () => {
        setPreviewPhoto(null);
        setSelectedPhotoFile(null);
        setPhotoError(undefined);
        setGlobalError(null);
        setShowPhotoDialog(false);
        notify.success("Photo removed! Click 'Save changes' to apply.");
    };

    const nameError = form.formState.errors.name?.message;
    const emailError = form.formState.errors.email?.message;
    const gstinError = form.formState.errors.gstin?.message;
    const formattedMobile = user?.mobile ? (user.mobile.startsWith("+") ? user.mobile : `+${user.mobile}`) : "Not provided";

    return (
        <>
            <Card className="rounded-none sm:rounded-2xl border-0 sm:border border-border bg-transparent sm:bg-card shadow-none sm:shadow-xs max-w-2xl overflow-hidden">
                <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="w-full">
                    <CardContent className="p-0 sm:p-5 space-y-4">
                        {/* Profile Photo Section */}
                        <div className="flex items-center gap-3 pb-3 border-b border-border">
                            <div
                                className="relative cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full shrink-0"
                                onClick={() => setShowPhotoDialog(true)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        setShowPhotoDialog(true);
                                    }
                                }}
                                role="button"
                                tabIndex={0}
                                aria-label="Change profile photo"
                            >
                                <div className="h-12 w-12 rounded-full border border-border overflow-hidden bg-card flex items-center justify-center relative shadow-2xs">
                                    {previewPhoto ? (
                                        <Image
                                            src={previewPhoto}
                                            alt="Profile"
                                            fill
                                            priority
                                            unoptimized
                                            className="object-cover"
                                            sizes="48px"
                                        />
                                    ) : (
                                        <User className="h-6 w-6 text-foreground-subtle" />
                                    )}
                                </div>
                                <div className="absolute bottom-0 right-0 h-4.5 w-4.5 rounded-full bg-primary text-primary-foreground border-2 border-card flex items-center justify-center shadow-2xs transition-transform group-hover:scale-105">
                                    <Camera className="h-2.5 w-2.5" />
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-small sm:text-body font-bold text-foreground tracking-tight">Profile photo</h4>
                                <p className="text-tiny text-muted-foreground">
                                    JPG, PNG, WEBP. Max 5MB. Click to upload or change.
                                </p>
                                <FormError message={photoError} />
                            </div>
                        </div>

                        {/* 2-Column Side-by-Side Form Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                            {/* Column 1: Full Name */}
                            <div className="space-y-1">
                                <Label htmlFor="profile-name" className="text-caption font-semibold text-foreground-secondary">
                                    Full name <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="profile-name"
                                    type="text"
                                    placeholder="Enter your full name"
                                    className="h-9 text-caption sm:text-body rounded-xl border-border bg-card px-3.5 focus-visible:ring-2 focus-visible:ring-primary"
                                    {...form.register("name")}
                                />
                                <FormError message={nameError} />
                            </div>

                            {/* Column 2: Mobile Number (Read-only verified) */}
                            <div className="space-y-1">
                                <Label htmlFor="profile-mobile" className="text-caption font-semibold text-foreground-secondary">
                                    Mobile number
                                </Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground-subtle" />
                                    <Input
                                        id="profile-mobile"
                                        type="tel"
                                        value={formattedMobile}
                                        readOnly
                                        disabled
                                        className="h-9 text-caption sm:text-body pl-8.5 pr-3.5 rounded-xl border-border bg-muted text-foreground font-medium cursor-not-allowed"
                                    />
                                </div>
                            </div>

                            {/* Column 1: Notification Email */}
                            <PersonalProfileEmailSection
                                register={form.register}
                                emailError={emailError}
                            />

                            {/* Column 2: GSTIN Field */}
                            <PersonalProfileGstSection
                                register={form.register}
                                gstinError={gstinError}
                            />
                        </div>

                        <FormError message={globalError} />

                        {/* Bottom Row: Toggle & Save Changes Button Side-by-Side */}
                        <div className="pt-3 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <Controller
                                    name="mobileVisibility"
                                    control={form.control}
                                    render={({ field }) => (
                                        <Switch
                                            id="mobile-visibility-toggle"
                                            checked={field.value === 'show'}
                                            onCheckedChange={(checked) => field.onChange(checked ? 'show' : 'hide')}
                                        />
                                    )}
                                />
                                <div>
                                    <Label htmlFor="mobile-visibility-toggle" className="text-caption sm:text-body font-semibold text-foreground cursor-pointer">
                                        Show number to buyers
                                    </Label>
                                    <p className="text-tiny text-foreground-subtle">Buyers can call you directly</p>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                size="sm"
                                disabled={isSaving}
                                className="w-full sm:w-auto h-9 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-caption px-6 rounded-xl transition-all shadow-xs active:scale-[0.98] flex items-center justify-center shrink-0"
                            >
                                {isSaving ? "Saving..." : "Save changes"}
                            </Button>
                        </div>
                    </CardContent>
                </form>
            </Card>

            <input
                ref={cameraInputRef}
                type="file"
                id="photo-upload-camera"
                className="hidden"
                accept={PROFILE_PHOTO_ACCEPT}
                capture="user"
                onChange={(e) => {
                    handlePhotoSelect(e);
                    e.target.value = "";
                }}
            />
            <input
                ref={galleryInputRef}
                type="file"
                id="photo-upload-gallery"
                className="hidden"
                accept={PROFILE_PHOTO_ACCEPT}
                onChange={(e) => {
                    handlePhotoSelect(e);
                    e.target.value = "";
                }}
            />
            <UploadSourcePicker
                open={showPhotoDialog}
                onOpenChange={setShowPhotoDialog}
                onCamera={handleCamera}
                onGallery={handleGallery}
                onRemovePhoto={handlePhotoDelete}
                variant="profile"
                showRemoveOption={Boolean(user?.profilePhoto)}
            />
        </>
    );
}
