"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { personalProfileSchema, type PersonalProfileValues, MOBILE_VISIBILITY } from "@esparex/contracts";

import { Button, Card, CardContent } from "@esparex/ui";
import { FormError } from "@/components/ui/FormError";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { User, Camera, Trash2, Lock } from "@/icons/IconRegistry";

import { updateProfile } from "@/lib/api/user/users";
import { notify } from "@/lib/feedback";
import { toSafeImageSrc } from "@/lib/image/imageUrl";
import { isAllowedProfilePhotoType, PROFILE_PHOTO_ALLOWED_LABEL, PROFILE_PHOTO_MAX_BYTES, PROFILE_PHOTO_ACCEPT } from "@/lib/uploads/profilePhotoUpload";
import type { User as UserType } from "@/types/User";
import type { ProfileUser } from "../types";
import { PersonalProfileEmailSection } from "./PersonalProfileEmailSection";
import { PersonalProfileGstSection } from "./PersonalProfileGstSection";
import { PersonalProfileBusinessSection } from "./PersonalProfileBusinessSection";
import { PersonalProfileMobileVisibilitySection } from "./PersonalProfileMobileVisibilitySection";

interface PersonalTabProps {
    user: ProfileUser | null;
    onUpdateUser: (userData: UserType) => void;
}

export function PersonalTab({ user, onUpdateUser }: PersonalTabProps) {
    const safeProfilePhoto = toSafeImageSrc(user?.profilePhoto || null, "");

    const [isSaving, setIsSaving] = useState(false);
    const [globalError, setGlobalError] = useState<string | null>(null);

    const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null);
    const [previewPhoto, setPreviewPhoto] = useState<string | null>(safeProfilePhoto);
    const [isPhotoRemoved, setIsPhotoRemoved] = useState(false);
    const [photoError, setPhotoError] = useState<string | undefined>(undefined);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleTriggerUpload = () => {
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
            fileInputRef.current.click();
        }
    };

    const form = useForm<PersonalProfileValues>({
        resolver: zodResolver(personalProfileSchema),
        defaultValues: {
            name: user?.name || "",
            email: user?.email || "",
            businessName: user?.businessName || "",
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
            formData.append("businessName", data.businessName || "");
            formData.append("gstin", data.gstin || "");
            formData.append("mobileVisibility", data.mobileVisibility);

            if (selectedPhotoFile) {
                formData.append("profilePhoto", selectedPhotoFile);
            } else if (isPhotoRemoved) {
                formData.append("removePhoto", "true");
                formData.append("profilePhoto", "");
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
        setIsPhotoRemoved(false);
        setPhotoError(undefined);
        setGlobalError(null);

        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewPhoto(reader.result as string);
            notify.success("Photo selected! Click 'Save changes' to upload.");
        };
        reader.readAsDataURL(file);
    };

    const handlePhotoDelete = () => {
        setPreviewPhoto(null);
        setSelectedPhotoFile(null);
        setIsPhotoRemoved(true);
        setPhotoError(undefined);
        setGlobalError(null);
        notify.success("Photo marked for removal. Click 'Save changes' to apply.");
    };

    const nameError = form.formState.errors.name?.message;
    const emailError = form.formState.errors.email?.message;
    const businessNameError = form.formState.errors.businessName?.message;
    const gstinError = form.formState.errors.gstin?.message;
    const formattedMobile = user?.mobile ? (user.mobile.startsWith("+") ? user.mobile : `+${user.mobile}`) : "Not provided";

    return (
        <Card className="rounded-none sm:rounded-2xl border-0 sm:border border-border bg-transparent sm:bg-card shadow-none sm:shadow-xs w-full overflow-hidden">
            <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="w-full">
                <CardContent className="p-0 sm:p-5 space-y-4">
                    {/* Profile Photo Header with Hover Action Overlay */}
                    <div className="flex items-center gap-4 pb-3 border-b border-border">
                        <div className="relative group shrink-0">
                            <div className="h-16 w-16 rounded-full border border-border overflow-hidden bg-card flex items-center justify-center relative shadow-xs">
                                {previewPhoto ? (
                                    <Image src={previewPhoto} alt="Profile" fill priority unoptimized className="object-cover" sizes="64px" />
                                ) : (
                                    <User className="h-8 w-8 text-foreground-subtle" />
                                )}
                            </div>
                            <div className="absolute inset-0 rounded-full bg-black/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <button type="button" onClick={handleTriggerUpload} className="h-7 w-7 rounded-full bg-white/90 hover:bg-white text-foreground flex items-center justify-center transition-transform hover:scale-105 shadow-2xs" title="Upload photo" aria-label="Upload photo">
                                    <Camera className="h-3.5 w-3.5" />
                                </button>
                                {previewPhoto && (
                                    <button type="button" onClick={handlePhotoDelete} className="h-7 w-7 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 flex items-center justify-center transition-transform hover:scale-105 shadow-2xs" title="Remove photo" aria-label="Remove photo">
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <h4 className="text-small sm:text-body font-bold text-foreground tracking-tight">Profile photo</h4>
                                <span className="text-tiny text-muted-foreground font-normal bg-muted/50 px-2 py-0.5 rounded-md border border-border/40">Max 5MB (JPG, PNG, WEBP)</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                <button type="button" onClick={handleTriggerUpload} className="text-tiny font-semibold text-primary hover:underline cursor-pointer">Upload new photo</button>
                                {previewPhoto && (
                                    <>
                                        <span className="text-tiny text-muted-foreground">•</span>
                                        <button type="button" onClick={handlePhotoDelete} className="text-tiny font-semibold text-destructive hover:underline cursor-pointer">Remove</button>
                                    </>
                                )}
                            </div>
                            <FormError message={photoError} />
                        </div>
                    </div>

                    {/* 3-Column Responsive Form Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
                        <div className="space-y-1">
                            <Label htmlFor="profile-name" className="text-caption font-semibold text-foreground-secondary">
                                Full name <span className="text-destructive">*</span>
                            </Label>
                            <Input id="profile-name" type="text" placeholder="Enter your full name" className="h-10 text-caption sm:text-body rounded-xl border-border bg-card px-3.5 font-medium focus-visible:ring-2 focus-visible:ring-primary" {...form.register("name")} />
                            <FormError message={nameError} />
                        </div>

                        <div className="space-y-1">
                            <Label htmlFor="profile-mobile" className="text-caption font-semibold text-foreground-secondary">Mobile number</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground-subtle" />
                                <Input id="profile-mobile" type="tel" value={formattedMobile} readOnly disabled className="h-10 text-caption sm:text-body pl-10 pr-3.5 rounded-xl border-border bg-muted text-foreground font-medium cursor-not-allowed" />
                            </div>
                        </div>

                        <PersonalProfileMobileVisibilitySection control={form.control} />

                        <PersonalProfileEmailSection register={form.register} emailError={emailError} />
                        <PersonalProfileBusinessSection register={form.register} businessNameError={businessNameError} />
                        <PersonalProfileGstSection register={form.register} gstinError={gstinError} />
                    </div>

                    <FormError message={globalError} />

                    <div className="pt-3 border-t border-border flex items-center justify-end">
                        <Button type="submit" size="sm" disabled={isSaving} className="w-full sm:w-auto h-9 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-caption px-6 rounded-xl transition-all shadow-xs active:scale-[0.98] flex items-center justify-center shrink-0">
                            {isSaving ? "Saving..." : "Save changes"}
                        </Button>
                    </div>
                </CardContent>
            </form>

            <input ref={fileInputRef} type="file" id="photo-upload-input" className="hidden" accept={PROFILE_PHOTO_ACCEPT} onChange={(e) => { handlePhotoSelect(e); e.target.value = ""; }} />
        </Card>
    );
}
