"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { personalProfileSchema, type PersonalProfileValues, MOBILE_VISIBILITY } from "@esparex/contracts";

import { Button, Switch } from "@esparex/ui";
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
            mobileVisibility: (user?.mobileVisibility as 'show' | 'hide' | 'on_request') || MOBILE_VISIBILITY.SHOW,
        },
    });

    const onSubmit = async (data: PersonalProfileValues) => {
        setGlobalError(null);
        setIsSaving(true);

        const submitData = new FormData();
        submitData.append("name", data.name);
        submitData.append("email", data.email);
        submitData.append("mobileVisibility", data.mobileVisibility);

        if (selectedPhotoFile) {
            submitData.append("profilePhoto", selectedPhotoFile);
        } else if (previewPhoto === null && user?.profilePhoto) {
            submitData.append("removePhoto", "true");
        }

        try {
            const updatedUser = await updateProfile(submitData, {
                headers: { "Content-Type": "multipart/form-data" },
                silent: true,
            });

            if (!updatedUser) {
                setGlobalError("Failed to update profile.");
                return;
            }

            onUpdateUser(updatedUser);
            setSelectedPhotoFile(null);
            notify.success("Profile updated successfully!");
        } catch (err: unknown) {
            setGlobalError(err instanceof Error ? err.message : "Failed to update profile");
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

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="w-full space-y-3.5">
            {/* Profile Photo Section */}
            <div className="flex items-center gap-3.5">
                <div
                    className="relative cursor-pointer group shrink-0"
                    onClick={() => setShowPhotoDialog(true)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setShowPhotoDialog(true);
                        }
                    }}
                    aria-label="Change profile photo"
                >
                    <div className="h-14 w-14 rounded-full border border-slate-200 overflow-hidden bg-white flex items-center justify-center relative shadow-2xs">
                        {previewPhoto ? (
                            <Image
                                src={previewPhoto}
                                alt="Profile"
                                fill
                                priority
                                unoptimized
                                className="object-cover"
                                sizes="56px"
                            />
                        ) : (
                            <User className="h-7 w-7 text-slate-400" />
                        )}
                    </div>
                    <div className="absolute bottom-0 right-0 h-5.5 w-5.5 rounded-full bg-slate-900 text-white border-2 border-white flex items-center justify-center shadow-2xs transition-transform group-hover:scale-105">
                        <Camera className="h-3 w-3" />
                    </div>
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">Profile photo</h4>
                    <p className="text-tiny sm:text-xs text-slate-500 mt-0.5">
                        JPG, PNG, WEBP. Max 5MB.
                    </p>
                    <FormError message={photoError} />
                </div>
            </div>

            {/* Full Name Field */}
            <div className="space-y-1.5">
                <Label htmlFor="profile-name" className="text-xs font-semibold text-slate-700">
                    Full name
                </Label>
                <Input
                    id="profile-name"
                    placeholder="Kalyn"
                    maxLength={50}
                    {...form.register("name")}
                    className={`h-10 sm:h-10.5 rounded-xl bg-white border-slate-200 px-3.5 text-xs sm:text-sm font-medium ${nameError ? "border-red-500" : ""}`}
                    aria-invalid={!!nameError}
                    aria-describedby={nameError ? "profile-name-error" : undefined}
                    autoComplete="name"
                />
                <FormError id="profile-name-error" message={nameError} />
            </div>

            {/* Email Field */}
            <div className="space-y-1.5">
                <Label htmlFor="profile-email" className="text-xs font-semibold text-slate-700">
                    Email
                </Label>
                <Input
                    id="profile-email"
                    type="email"
                    placeholder="name@company.com"
                    {...form.register("email")}
                    className={`h-10 sm:h-10.5 rounded-xl bg-white border-slate-200 px-3.5 text-xs sm:text-sm font-medium ${emailError ? "border-red-500" : ""}`}
                    aria-invalid={!!emailError}
                    aria-describedby={emailError ? "profile-email-error" : undefined}
                    autoComplete="email"
                />
                <FormError id="profile-email-error" message={emailError} />
            </div>

            {/* Mobile Number Read-Only Display */}
            <div className="space-y-1.5">
                <Label htmlFor="profile-mobile" className="text-xs font-semibold text-slate-700">
                    Mobile number
                </Label>
                <div className="h-10 sm:h-10.5 rounded-xl bg-slate-100/70 border border-slate-200/80 px-3.5 flex items-center gap-2.5">
                    <Lock className="h-4 w-4 text-slate-400 shrink-0" />
                    <span className="text-xs sm:text-sm font-semibold text-slate-800 tracking-wide">
                        {user?.mobile ? (user.mobile.startsWith("+") ? user.mobile : `+91 ${user.mobile}`) : "+91 96787 87688"}
                    </span>
                </div>
            </div>

            {/* Show Number to Buyers Switch Row */}
            <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between gap-3">
                <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">Show number to buyers</h4>
                    <p className="text-tiny text-slate-500 mt-0.5">Buyers can call you directly</p>
                </div>
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
            </div>

            <FormError message={globalError} />

            {/* Full-Width Dark Save Changes Button (Normal Standard Button Size) */}
            <Button
                type="submit"
                size="lg"
                disabled={isSaving}
                className="w-full h-11 sm:h-12 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm sm:text-base rounded-xl transition-all shadow-sm active:scale-[0.98] mt-4 flex items-center justify-center min-h-[44px]"
            >
                {isSaving ? "Saving..." : "Save changes"}
            </Button>

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
        </form>
    );
}
