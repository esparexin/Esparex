"use client";

import { useState } from "react";
import Image from "next/image";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { personalProfileSchema, type PersonalProfileValues } from "@esparex/contracts";
import { MOBILE_VISIBILITY } from "@esparex/contracts";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button, Switch } from "@esparex/ui";
import { FormError } from "@/components/ui/FormError";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { User, Camera, Upload, Trash2, Save } from "@/icons/IconRegistry";
import { PhoneInput } from "../PhoneInput";
import { PhotoOptionsDialog } from "../dialogs/PhotoOptionsDialog";

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
            // They removed the photo, we might need to send a flag to delete it,
            // or maybe updateProfile handles empty profilePhoto?
            // Assuming the API allows setting it to empty.
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
            notify.success("Photo selected! Click 'Save Changes' to upload.");
        };
        reader.readAsDataURL(file);
    };

    const handlePhotoDelete = () => {
        setPreviewPhoto(null);
        setSelectedPhotoFile(null);
        setPhotoError(undefined);
        setGlobalError(null);
        setShowPhotoDialog(false);
        notify.success("Photo removed! Click 'Save Changes' to apply.");
    };

    const nameError = form.formState.errors.name?.message;
    const emailError = form.formState.errors.email?.message;

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
            <Card className="account-card-surface border-0 shadow-sm md:border md:shadow-sm">
                <CardHeader className="pb-2">
                    <CardTitle className="account-section-title flex items-center gap-2">
                        <User className="h-5 w-5 text-link" />
                        Personal Information
                    </CardTitle>
                    <CardDescription className="account-body-text">Update your personal details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                    {/* Profile Photo Section */}
                    <div className="space-y-2">
                        <Label className="account-field-label">Profile Photo</Label>
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <div className="h-16 w-16 md:h-20 md:w-20 rounded-full border-2 border-slate-100 overflow-hidden bg-slate-50 flex items-center justify-center shadow-inner">
                                    {previewPhoto ? (
                                        <Image
                                            src={previewPhoto}
                                            alt="Profile"
                                            fill
                                            priority
                                            unoptimized
                                            className="object-cover"
                                            sizes="80px"
                                        />
                                    ) : (
                                        <User className="h-8 w-8 md:h-10 md:w-10 text-foreground-subtle" />
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowPhotoDialog(true)}
                                    aria-label="Upload profile photo"
                                    title="Upload profile photo"
                                    className="absolute -bottom-1 -right-1 flex h-11 w-11 items-center justify-center rounded-full border-2 border-white bg-blue-600 text-white shadow-md transition-transform active:scale-95 z-10 hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                                >
                                    <Camera className="h-5 w-5" />
                                </button>
                            </div>
                            <div className="flex-1">
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setShowPhotoDialog(true)}
                                        className="gap-2"
                                    >
                                        <Upload className="h-3 w-3" />
                                        Upload
                                    </Button>
                                    {previewPhoto && (
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="ghost"
                                            onClick={handlePhotoDelete}
                                            className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                        >
                                            <Trash2 className="h-3 w-3" />
                                            Remove
                                        </Button>
                                    )}
                                </div>
                                <p className="mt-1.5 text-xs text-muted-foreground">
                                    {PROFILE_PHOTO_ALLOWED_LABEL}. Max 5MB.
                                </p>
                                <FormError message={photoError} />
                            </div>
                        </div>
                    </div>

                    <Separator className="my-2" />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between max-w-[420px]">
                                <Label htmlFor="profile-name">Full Name *</Label>
                                {/* eslint-disable-next-line react-hooks/incompatible-library -- intentional: form.watch() for live char count; react-hook-form limitation */}
                                <span className={`text-xs font-medium ${(form.watch('name') || "").length > 50 ? "text-destructive" : "text-muted-foreground"}`}>
                                    {(form.watch('name') || "").length}/50
                                </span>
                            </div>
                            <Input
                                id="profile-name"
                                placeholder="Enter your name"
                                maxLength={50}
                                {...form.register("name")}
                                className={`max-w-[420px] ${nameError ? "border-red-500" : ""}`}
                                aria-invalid={!!nameError}
                                aria-describedby={nameError ? "profile-name-error" : undefined}
                                autoComplete="name"
                            />
                            <FormError id="profile-name-error" message={nameError} />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="profile-email">Email *</Label>
                            <Input
                                id="profile-email"
                                type="email"
                                placeholder="Enter your email"
                                {...form.register("email")}
                                className={`max-w-[420px] ${emailError ? "border-red-500" : ""}`}
                                aria-invalid={!!emailError}
                                aria-describedby={emailError ? "profile-email-error" : undefined}
                                autoComplete="email"
                            />
                            <FormError id="profile-email-error" message={emailError} />
                        </div>

                        <div className="space-y-1.5 md:col-span-2 max-w-[420px]">
                            <div className="flex items-center justify-between pb-0.5">
                                <Label htmlFor="mobile-visibility-toggle">Mobile Number</Label>
                                <div className="flex items-center gap-2">
                                    <Label htmlFor="mobile-visibility-toggle" className="text-xs text-muted-foreground font-normal cursor-pointer">
                                        {form.watch('mobileVisibility') === 'show' ? "Visible to buyers" : "Hidden from buyers"}
                                    </Label>
                                    <Controller
                                        name="mobileVisibility"
                                        control={form.control}
                                        render={({ field }) => (
                                            <Switch
                                                id="mobile-visibility-toggle"
                                                checked={field.value === 'show'}
                                                onCheckedChange={(checked) => field.onChange(checked ? 'show' : 'hide')}
                                                className="scale-90 origin-right"
                                            />
                                        )}
                                    />
                                </div>
                            </div>
                            <PhoneInput
                                id="profile-mobile"
                                name="mobile"
                                value={user?.mobile || ""}
                                disabled
                                isVerified={user?.isPhoneVerified}
                                autoComplete="tel"
                            />
                            <p className="mt-1 text-xs text-muted-foreground">
                                Your verified mobile number is managed separately. Need to change it? <a href="mailto:support@esparex.com" className="text-link hover:underline">Contact Support</a>
                            </p>
                        </div>
                    </div>

                    <div className="fixed bottom-16 left-0 right-0 z-30 p-3 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-lg md:static md:p-0 md:bg-transparent md:border-0 md:shadow-none md:pt-3 md:flex md:justify-end">
                        <div className="w-full md:w-auto">
                            <FormError message={globalError} />
                            <Button
                                type="submit"
                                disabled={isSaving}
                                className="w-full md:w-auto md:min-w-[200px] md:max-w-[320px] bg-blue-600 text-white shadow-lg shadow-blue-200/50 hover:bg-blue-700 disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 h-12 md:h-10 text-sm font-semibold"
                            >
                                <Save className="h-4 w-4 mr-2" />
                                {isSaving ? "Saving..." : "Save Changes"}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <input 
                type="file" 
                id="photo-upload" 
                className="hidden" 
                accept={PROFILE_PHOTO_ACCEPT} 
                onChange={handlePhotoSelect} 
            />
            <PhotoOptionsDialog 
                open={showPhotoDialog} 
                onOpenChange={setShowPhotoDialog} 
                onPhotoSelect={() => document.getElementById('photo-upload')?.click()} 
                onPhotoDelete={handlePhotoDelete} 
            />
        </form>
    );
}
