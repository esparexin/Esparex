import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/FormError";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { User, Camera, Upload, Trash2, Building2, Save, Phone, Eye, EyeOff, Bell, CheckCircle2, XCircle, Shield } from "lucide-react";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { notify } from "@/lib/notify";
import type {
    MobileRequest,
    MobileVisibility,
    ProfileFormData,
} from "../types";
import { type Business } from "@/api/user/businesses";
import { BusinessApplicationStatus } from "../BusinessApplicationStatus";
import { toSafeImageSrc } from "@/lib/image/imageUrl";

interface PersonalTabProps {
    profilePhoto: string | null;
    formData: ProfileFormData;
    setFormData: (data: ProfileFormData) => void;
    mobileVisibility: MobileVisibility;
    setMobileVisibility: (v: MobileVisibility) => void;
    mobileRequests: MobileRequest[];
    setMobileRequests: (reqs: MobileRequest[]) => void;
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
    businessData?: Business | null;
    onEditBusinessApplication?: () => void;
    navigateToBusinessTab?: () => void;
}

export function PersonalTab({
    profilePhoto,
    formData,
    setFormData,
    mobileVisibility,
    setMobileVisibility,
    mobileRequests,
    setMobileRequests,
    handleSaveProfile,
    onPhotoClick,
    handlePhotoDelete,
    profileErrors,
    profileGlobalError,
    isSavingProfile,
    clearProfileError,
    businessData,
    onEditBusinessApplication,
    navigateToBusinessTab
}: PersonalTabProps) {
    const safeProfilePhoto = toSafeImageSrc(profilePhoto, "");

    return (
        <div className="space-y-4">
            {businessData && (
                <BusinessApplicationStatus
                    businessData={businessData}
                    onEditApplication={onEditBusinessApplication}
                    navigateToBusinessTab={navigateToBusinessTab}
                />
            )}

            <Card className="border-0 shadow-sm md:border md:shadow-sm">
                <CardHeader className="pb-2 px-4 md:px-6">
                    <CardTitle className="text-xl md:text-2xl flex items-center gap-2">
                        <User className="h-5 w-5 text-blue-600" />
                        Personal Information
                    </CardTitle>
                    <CardDescription className="text-xs md:text-sm">Update your personal details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 px-4 md:px-6 pb-6">
                    {/* Profile Photo Section */}
                    <div className="space-y-2">
                        <Label className="text-lg font-medium">Profile Photo</Label>
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <div className="h-16 w-16 md:h-20 md:w-20 rounded-full border-2 border-slate-100 overflow-hidden bg-slate-50 flex items-center justify-center shadow-inner">
                                    {safeProfilePhoto ? (
                                        <Image
                                            src={safeProfilePhoto}
                                            alt="Profile"
                                            fill
                                            className="object-cover"
                                            sizes="80px"
                                        />
                                    ) : (
                                        <User className="h-8 w-8 md:h-10 md:w-10 text-slate-300" />
                                    )}
                                </div>
                                <button
                                    onClick={onPhotoClick}
                                    className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-blue-600 text-white hover:bg-blue-700 shadow-md border-2 border-white transition-transform active:scale-95 z-10"
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
                                        className="h-8 text-xs gap-2"
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
                                            className="h-8 text-xs gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                        >
                                            <Trash2 className="h-3 w-3" />
                                            Remove
                                        </Button>
                                    )}
                                </div>
                                <p className="text-[10px] md:text-xs text-muted-foreground mt-1.5">
                                    JPG, PNG. Max 5MB.
                                </p>
                                <FormError message={profileErrors?.photo} />
                            </div>
                        </div>
                    </div>

                    <Separator className="my-2" />

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="profile-name" className="text-xs md:text-sm">Full Name *</Label>
                            <Input
                                id="profile-name"
                                name="name"
                                placeholder="Enter your name"
                                value={formData.name}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                    if (profileErrors?.name) clearProfileError?.("name");
                                    setFormData({ ...formData, name: e.target.value });
                                }}
                                className={`h-12 md:h-11 ${profileErrors?.name ? "border-red-500" : ""}`}
                                aria-invalid={!!profileErrors?.name}
                                aria-describedby={profileErrors?.name ? "profile-name-error" : undefined}
                                autoComplete="name"
                            />
                            <FormError id="profile-name-error" message={profileErrors?.name} />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="profile-email" className="text-xs md:text-sm">Email *</Label>
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
                                className={`h-12 md:h-11 ${profileErrors?.email ? "border-red-500" : ""}`}
                                aria-invalid={!!profileErrors?.email}
                                aria-describedby={profileErrors?.email ? "profile-email-error" : undefined}
                                autoComplete="email"
                            />
                            <FormError id="profile-email-error" message={profileErrors?.email} />
                        </div>

                        <div className="space-y-1.5 md:col-span-2">
                            <Label htmlFor="profile-phone" className="text-xs md:text-sm">Phone Number</Label>
                            <PhoneInput
                                id="profile-phone"
                                name="phone"
                                value={formData.phone}
                                disabled
                                isVerified={true}
                                autoComplete="tel"
                            />
                            <p className="text-[10px] text-muted-foreground mt-1">
                                Need to change your number? <a href="mailto:support@esparex.com" className="text-blue-600 hover:underline">Contact Support</a>
                            </p>
                        </div>
                    </div>

                    <div className="pt-2">
                        <div className="p-3 md:p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                            <div className="flex items-center gap-2 mb-1">
                                <Building2 className="h-4 w-4 text-slate-500" />
                                <h3 className="font-semibold text-sm text-slate-900">Billing Details (Optional)</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label htmlFor="billing-business-name" className="text-xs">Business Name</Label>
                                    <Input
                                        id="billing-business-name"
                                        name="businessName"
                                        placeholder="Registered Business Name"
                                        value={formData.businessName || ""}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                            if (profileErrors?.businessName) clearProfileError?.("businessName");
                                            setFormData({ ...formData, businessName: e.target.value });
                                        }}
                                        className={`h-12 md:h-11 bg-white ${profileErrors?.businessName ? "border-red-500" : ""}`}
                                        aria-invalid={!!profileErrors?.businessName}
                                        aria-describedby={profileErrors?.businessName ? "profile-business-name-error" : undefined}
                                        autoComplete="organization"
                                    />
                                    <FormError id="profile-business-name-error" message={profileErrors?.businessName} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="billing-gst-number" className="text-xs">GST Number</Label>
                                    <Input
                                        id="billing-gst-number"
                                        name="gstNumber"
                                        placeholder="GSTIN"
                                        value={formData.gstNumber || ""}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                            if (profileErrors?.gstNumber) clearProfileError?.("gstNumber");
                                            setFormData({ ...formData, gstNumber: e.target.value });
                                        }}
                                        className={`h-12 md:h-11 bg-white ${profileErrors?.gstNumber ? "border-red-500" : ""}`}
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
                                className="mt-1 w-full md:w-auto bg-blue-600 hover:bg-blue-700 h-12 md:h-11 rounded-[10px] shadow-lg shadow-blue-200/50 text-white border-0 disabled:opacity-70"
                            >
                                <Save className="h-4 w-4 mr-2" />
                                {isSavingProfile ? "Saving..." : "Save Changes"}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Mobile Number Visibility Card */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Phone className="h-5 w-5" />
                        Mobile Number Visibility
                    </CardTitle>
                    <CardDescription>Control who can see your mobile number</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-3">
                        <p className="text-sm font-semibold text-slate-700">Choose who can view your number:</p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {/* Show to All */}
                            <div
                                onClick={() => setMobileVisibility("show")}
                                className={`cursor-pointer p-4 rounded-2xl border-2 transition-all flex flex-col gap-2 
                                ${mobileVisibility === "show" ? "border-blue-600 bg-blue-50/50" : "border-slate-100 hover:border-slate-200 bg-white"}`}
                            >
                                <div className="flex items-center justify-between">
                                    <Eye className={`h-5 w-5 ${mobileVisibility === "show" ? "text-blue-600" : "text-slate-400"}`} />
                                    {mobileVisibility === "show" && <div className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />}
                                </div>
                                <div>
                                    <p className="font-bold text-sm text-slate-900">Show to All</p>
                                    <p className="text-[10px] text-slate-500 leading-tight">Visible on all your ads to verified buyers.</p>
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
                                    <p className="font-bold text-sm text-slate-900">Hide</p>
                                    <p className="text-[10px] text-slate-500 leading-tight">Buyers will not be able to see your number.</p>
                                </div>
                            </div>

                            {/* On Request */}
                            <div
                                onClick={() => setMobileVisibility("on-request")}
                                className={`cursor-pointer p-4 rounded-2xl border-2 transition-all flex flex-col gap-2 
                                ${mobileVisibility === "on-request" ? "border-amber-600 bg-amber-50/50" : "border-slate-100 hover:border-slate-200 bg-white"}`}
                            >
                                <div className="flex items-center justify-between">
                                    <Bell className={`h-5 w-5 ${mobileVisibility === "on-request" ? "text-amber-600" : "text-slate-400"}`} />
                                    {mobileVisibility === "on-request" && <div className="h-2 w-2 rounded-full bg-amber-600 animate-pulse" />}
                                </div>
                                <div>
                                    <p className="font-bold text-sm text-slate-900">On Request</p>
                                    <p className="text-[10px] text-slate-500 leading-tight">Buyers must ask for permission to view your number.</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-dashed border-slate-200 mt-2">
                            <Shield className="h-4 w-4 text-blue-500" />
                            <p className="text-[10px] text-slate-500 font-medium italic">
                                Note: Visibility changes will apply across all your active listings when you click "Save Changes" above.
                            </p>
                        </div>
                    </div>

                    {/* Mobile Number Requests Section */}
                    {mobileVisibility === "on-request" && mobileRequests.filter(r => r.status === "pending").length > 0 && (
                        <>
                            <Separator />
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-sm font-medium">Pending Requests ({mobileRequests.filter(r => r.status === "pending").length})</p>
                                    <Badge className="bg-blue-600">{mobileRequests.filter(r => r.status === "pending").length} New</Badge>
                                </div>
                                <div className="space-y-2">
                                    {mobileRequests.filter(r => r.status === "pending").map((request) => (
                                        <div key={request.id} className="bg-gray-50 p-3 rounded-lg">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-sm">{request.buyerName}</p>
                                                    <p className="text-xs text-muted-foreground truncate">{request.adTitle}</p>
                                                    <p className="text-xs text-muted-foreground mt-0.5">{request.requestedAt}</p>
                                                </div>
                                                <div className="flex gap-1 flex-shrink-0">
                                                    <Button
                                                        size="sm"
                                                        className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white border-0"
                                                        onClick={() => {
                                                            setMobileRequests(mobileRequests.map(r =>
                                                                r.id === request.id ? { ...r, status: "approved" } : r
                                                            ));
                                                            notify.success(`Mobile number shared with ${request.buyerName} `);
                                                        }}
                                                    >
                                                        <CheckCircle2 className="h-3 w-3 mr-1" />
                                                        Approve
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-7 text-xs"
                                                        onClick={() => {
                                                            setMobileRequests(mobileRequests.map(r =>
                                                                r.id === request.id ? { ...r, status: "denied" } : r
                                                            ));
                                                            notify.info("Request denied");
                                                        }}
                                                    >
                                                        <XCircle className="h-3 w-3 mr-1" />
                                                        Deny
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {mobileVisibility === "on-request" && mobileRequests.filter(r => r.status === "pending").length === 0 && (
                        <>
                            <Separator />
                            <div className="text-center py-4">
                                <Bell className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                                <p className="text-xs text-muted-foreground">No pending mobile number requests</p>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
