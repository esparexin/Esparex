import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/FormError";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { User, Camera, Upload, Trash2, Building2, Save, Phone, Eye, EyeOff, Shield } from "lucide-react";
import { PhoneInput } from "@/components/ui/PhoneInput";
import type {
    MobileVisibility,
    ProfileFormData,
} from "../types";
import { toSafeImageSrc } from "@/lib/image/imageUrl";
import { PROFILE_PHOTO_ALLOWED_LABEL } from "@/lib/uploads/profilePhotoUpload";

interface PersonalTabProps {
    profilePhoto: string | null;
    formData: ProfileFormData;
    setFormData: (data: ProfileFormData) => void;
    mobileVisibility: MobileVisibility;
    setMobileVisibility: (v: MobileVisibility) => void;
    handleSaveProfile: () => void;
    onPhotoClick: () => void;
    handlePhotoDelete: () => void;
    profileErrors?: {
        name?: string;
        email?: string;
        businessName?: string;
        gstNumber?: string;
        photo?: string;
    };
    profileGlobalError?: string | null;
    isSavingProfile?: boolean;
    clearProfileError?: (field: "name" | "email" | "businessName" | "gstNumber" | "photo") => void;
}

export function PersonalTab({
    profilePhoto,
    formData,
    setFormData,
    mobileVisibility,
    setMobileVisibility,
    handleSaveProfile,
    onPhotoClick,
    handlePhotoDelete,
    profileErrors,
    profileGlobalError,
    isSavingProfile,
    clearProfileError,
}: PersonalTabProps) {
    const safeProfilePhoto = toSafeImageSrc(profilePhoto, "");

    return (
        <div className="space-y-4">
            <Card className="border-0 shadow-sm md:border md:shadow-sm gap-0">
                <CardHeader className="pb-2 px-4 md:px-6">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <User className="h-5 w-5 text-link" />
                        Personal Information
                    </CardTitle>
                    <CardDescription>Update your personal details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 px-4 md:px-6 pb-6">
                    {/* Profile Photo Section */}
                    <div className="space-y-2">
                        <Label className="text-sm">Profile Photo</Label>
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <div className="h-16 w-16 md:h-20 md:w-20 rounded-full border-2 border-slate-100 overflow-hidden bg-slate-50 flex items-center justify-center shadow-inner">
                                    {safeProfilePhoto ? (
                                        <Image
                                            src={safeProfilePhoto}
                                            alt="Profile"
                                            fill
                                            priority
                                            unoptimized
                                            className="object-cover"
                                            sizes="80px"
                                        />
                                    ) : (
                                        <User className="h-8 w-8 md:h-10 md:w-10 text-slate-300" />
                                    )}
                                </div>
                                <button
                                    onClick={onPhotoClick}
                                    className="absolute -bottom-1 -right-1 flex h-11 w-11 items-center justify-center rounded-full border-2 border-white bg-blue-600 text-white shadow-md transition-transform active:scale-95 z-10 hover:bg-blue-700"
                                >
                                    <Camera className="h-3 w-3" />
                                </button>
                            </div>
                            <div className="flex-1">
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={onPhotoClick}
                                        className="gap-2"
                                    >
                                        <Upload className="h-3 w-3" />
                                        Upload
                                    </Button>
                                    {profilePhoto && (
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
                                <FormError message={profileErrors?.photo} />
                            </div>
                        </div>
                    </div>

                    <Separator className="my-2" />

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="profile-name">Full Name *</Label>
                            <Input
                                id="profile-name"
                                name="name"
                                placeholder="Enter your name"
                                value={formData.name}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                    if (profileErrors?.name) clearProfileError?.("name");
                                    setFormData({ ...formData, name: e.target.value });
                                }}
                                className={profileErrors?.name ? "border-red-500" : ""}
                                aria-invalid={!!profileErrors?.name}
                                aria-describedby={profileErrors?.name ? "profile-name-error" : undefined}
                                autoComplete="name"
                            />
                            <FormError id="profile-name-error" message={profileErrors?.name} />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="profile-email">Email *</Label>
                            <Input
                                id="profile-email"
                                name="email"
                                type="email"
                                placeholder="Enter your email"
                                value={formData.email}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                    if (profileErrors?.email) clearProfileError?.("email");
                                    setFormData({ ...formData, email: e.target.value });
                                }}
                                className={profileErrors?.email ? "border-red-500" : ""}
                                aria-invalid={!!profileErrors?.email}
                                aria-describedby={profileErrors?.email ? "profile-email-error" : undefined}
                                autoComplete="email"
                            />
                            <FormError id="profile-email-error" message={profileErrors?.email} />
                        </div>

                        <div className="space-y-1.5 md:col-span-2">
                            <Label htmlFor="profile-phone">Phone Number</Label>
                            <PhoneInput
                                id="profile-phone"
                                name="phone"
                                value={formData.phone}
                                disabled
                                isVerified={true}
                                autoComplete="tel"
                            />
                            <p className="mt-1 text-xs text-muted-foreground">
                                Need to change your number? <a href="mailto:support@esparex.com" className="text-link hover:underline">Contact Support</a>
                            </p>
                        </div>
                    </div>

                    <div className="pt-2">
                        <div className="p-3 md:p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                            <div className="flex items-center gap-2 mb-1">
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                <h3 className="font-semibold text-sm text-foreground">Billing Details (Optional)</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label htmlFor="billing-business-name">Business Name</Label>
                                    <Input
                                        id="billing-business-name"
                                        name="businessName"
                                        placeholder="Registered Business Name"
                                        value={formData.businessName || ""}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                            if (profileErrors?.businessName) clearProfileError?.("businessName");
                                            setFormData({ ...formData, businessName: e.target.value });
                                        }}
                                        className={`bg-white ${profileErrors?.businessName ? "border-red-500" : ""}`}
                                        aria-invalid={!!profileErrors?.businessName}
                                        aria-describedby={profileErrors?.businessName ? "profile-business-name-error" : undefined}
                                        autoComplete="organization"
                                    />
                                    <FormError id="profile-business-name-error" message={profileErrors?.businessName} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="billing-gst-number">GST Number</Label>
                                    <Input
                                        id="billing-gst-number"
                                        name="gstNumber"
                                        placeholder="GSTIN"
                                        value={formData.gstNumber || ""}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                            if (profileErrors?.gstNumber) clearProfileError?.("gstNumber");
                                            setFormData({ ...formData, gstNumber: e.target.value });
                                        }}
                                        className={`bg-white ${profileErrors?.gstNumber ? "border-red-500" : ""}`}
                                        aria-invalid={!!profileErrors?.gstNumber}
                                        aria-describedby={profileErrors?.gstNumber ? "profile-gst-number-error" : undefined}
                                        autoComplete="off"
                                    />
                                    <FormError id="profile-gst-number-error" message={profileErrors?.gstNumber} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                        <div className="w-full md:w-auto">
                            <FormError message={profileGlobalError} />
                            <Button
                                onClick={handleSaveProfile}
                                disabled={isSavingProfile}
                                className="mt-1 w-full md:w-auto bg-blue-600 text-white shadow-lg shadow-blue-200/50 hover:bg-blue-700 disabled:opacity-70"
                            >
                                <Save className="h-4 w-4 mr-2" />
                                {isSavingProfile ? "Saving..." : "Save Changes"}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Mobile Number Visibility Card */}
            <Card className="gap-0">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Phone className="h-5 w-5" />
                        Mobile Number Visibility
                    </CardTitle>
                    <CardDescription>Control who can see your mobile number</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-3">
                        <p className="text-sm font-semibold text-slate-700">Choose who can view your number:</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {/* Show to All */}
                            <div
                                onClick={() => setMobileVisibility("show")}
                                className={`cursor-pointer p-4 rounded-2xl border-2 transition-all flex flex-col gap-2 
                                ${mobileVisibility === "show" ? "border-blue-600 bg-blue-50/50" : "border-slate-100 hover:border-slate-200 bg-white"}`}
                            >
                                <div className="flex items-center justify-between">
                                    <Eye className={`h-5 w-5 ${mobileVisibility === "show" ? "text-link" : "text-slate-400"}`} />
                                    {mobileVisibility === "show" && <div className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />}
                                </div>
                                <div>
                                    <p className="font-bold text-sm text-foreground">Show to All</p>
                                    <p className="text-xs text-muted-foreground leading-tight">Visible on all your ads to verified buyers.</p>
                                </div>
                            </div>

                            {/* Hide */}
                            <div
                                onClick={() => setMobileVisibility("hide")}
                                className={`cursor-pointer p-4 rounded-2xl border-2 transition-all flex flex-col gap-2 
                                ${mobileVisibility === "hide" ? "border-red-600 bg-red-50/50" : "border-slate-100 hover:border-slate-200 bg-white"}`}
                            >
                                <div className="flex items-center justify-between">
                                    <EyeOff className={`h-5 w-5 ${mobileVisibility === "hide" ? "text-red-600" : "text-slate-400"}`} />
                                    {mobileVisibility === "hide" && <div className="h-2 w-2 rounded-full bg-red-600 animate-pulse" />}
                                </div>
                                <div>
                                    <p className="font-bold text-sm text-foreground">Hide</p>
                                    <p className="text-xs text-muted-foreground leading-tight">Buyers will not be able to see your number.</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-dashed border-slate-200 mt-2">
                            <Shield className="h-4 w-4 text-blue-500" />
                            <p className="text-xs text-muted-foreground font-medium italic">
                                Note: Visibility changes will apply across all your active listings when you click "Save Changes" above.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
