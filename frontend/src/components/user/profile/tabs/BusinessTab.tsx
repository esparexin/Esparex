import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Building2,
    CheckCircle2,
    MapPin,
    Phone,
    Mail,
    Map,
    Edit2,
    PlusCircle,
    ArrowLeft,
    FileText,
    Upload,
    ClipboardCheck,
    BadgeCheck,
    ArrowRight,
} from "lucide-react";
import { BusinessEditFlow } from "../../BusinessEditFlow";
import { type Business } from "@/api/user/businesses";
import type { User } from "@/types/User";
import { normalizeBusinessStatus } from "@/lib/status/statusNormalization";
import { BusinessApplicationStatus } from "../BusinessApplicationStatus";

const registrationProcessSteps = [
    {
        title: "Add business details",
        description: "Fill in business profile info, contact details, and upload shop images.",
        icon: FileText,
    },
    {
        title: "Provide address",
        description: "Enter your shop location so customers can discover you in their area.",
        icon: MapPin,
    },
    {
        title: "Upload verification docs",
        description: "Submit ID proof and business proof for admin verification.",
        icon: Upload,
    },
    {
        title: "Review and submit",
        description: "Confirm all details and send your application for approval.",
        icon: ClipboardCheck,
    },
];

interface BusinessTabProps {
    businessData: Business | null;
    businessStats?: { totalServices: number; approvedServices: number; pendingServices: number; views: number };
    isLoading?: boolean;
    isFetched?: boolean;
    showBusinessEditForm: boolean;
    setShowBusinessEditForm: (show: boolean) => void;
    user: User | null;
    onUpdateUser: (userData: User) => void;
    navigateTo: (page: string, adId?: string | number, category?: string, sellerIdOrBusinessId?: string) => void;
    setActiveTab: (tab: string) => void;
}

export function BusinessTab({
    businessData,
    businessStats,
    isLoading,
    isFetched,
    showBusinessEditForm,
    setShowBusinessEditForm,
    user,
    onUpdateUser,
    navigateTo,
}: BusinessTabProps) {
    // 🧱 LOADING SKELETON (Prevent Flash)
    if (isLoading && !isFetched) {
        return (
            <div className="space-y-4 animate-pulse">
                <div className="h-64 bg-slate-200 rounded-[2.5rem]" />
                <div className="grid grid-cols-2 gap-3">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-24 bg-slate-100 rounded-xl" />
                    ))}
                </div>
                <div className="h-48 bg-slate-50 rounded-xl" />
            </div>
        );
    }

    const businessDataStatus = businessData
        ? normalizeBusinessStatus(businessData.status, "pending")
        : "pending";

    if (businessData && businessDataStatus === "live") {
        if (showBusinessEditForm) {
            return (
                <div className="space-y-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowBusinessEditForm(false)}
                        className="gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Business Overview
                    </Button>

                    <BusinessEditFlow
                        user={user}
                        onUpdateUser={onUpdateUser}
                        onComplete={() => setShowBusinessEditForm(false)}
                    />
                </div>
            );
        }

        return (
            <div className="space-y-4">
                <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 border-0 shadow-2xl rounded-[2.5rem] overflow-hidden text-white relative">
                    <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                        <Building2 className="w-32 h-32" />
                    </div>
                    <CardContent className="p-8 relative z-10">
                        <div className="flex flex-col md:flex-row items-center text-center md:text-left gap-8">
                            <div className="h-28 w-28 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center flex-shrink-0 shadow-inner">
                                <Building2 className="h-14 w-14 text-white drop-shadow-lg" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-4 mb-4">
                                    <div className="space-y-1">
                                        <h2 className="font-bold text-3xl tracking-tight">{businessData.businessName}</h2>
                                        <div className="flex items-center gap-2 justify-center md:justify-start">
                                            <Badge className="bg-white/20 hover:bg-white/30 text-white border-white/20 backdrop-blur-md px-3 py-1 flex items-center gap-1.5 rounded-full text-xs font-semibold">
                                                <CheckCircle2 className="h-3.5 w-3.5 text-blue-300" />
                                                Official Verified Business
                                            </Badge>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 mb-6">
                                    <div className="flex items-start gap-3 justify-center md:justify-start">
                                        <MapPin className="h-5 w-5 text-blue-300 flex-shrink-0 mt-0.5" />
                                        <span className="text-sm text-blue-50 font-medium">
                                            {businessData.location?.address || "123 Tech Street, Electronic City"}, {businessData.location?.city || "Bangalore"} - {businessData.location?.pincode || "560100"}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 justify-center md:justify-start group relative">
                                        <Phone className="h-5 w-5 text-blue-300 flex-shrink-0" />
                                        <div className="flex flex-col items-center md:items-start text-center md:text-left">
                                            <span className="text-sm text-blue-50 font-medium">+91 {businessData.contactNumber}</span>
                                            <a href="mailto:support@esparex.com" className="text-[10px] text-blue-200 hover:text-white hover:underline transition-colors mt-0.5">Contact Support to change</a>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 justify-center md:justify-start">
                                        <Mail className="h-5 w-5 text-blue-300 flex-shrink-0" />
                                        <span className="text-sm text-blue-50 font-medium uppercase tracking-wide">{businessData.email}</span>
                                    </div>
                                    <div className="flex items-center gap-3 justify-center md:justify-start">
                                        <Map className="h-5 w-5 text-blue-300 flex-shrink-0" />
                                        <span className="text-sm text-blue-50 font-medium">
                                            {businessData.website || "—"}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex flex-wrap justify-center md:justify-start gap-3">
                                    <Button
                                        onClick={() => {
                                            navigateTo("profile-settings-business");
                                        }}
                                        className="bg-white text-blue-700 hover:bg-blue-50 border-0 shadow-lg shadow-black/10 px-6 font-bold h-11 rounded-2xl"
                                    >
                                        <Edit2 className="h-4 w-4 mr-2" />
                                        Edit Profile
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            const businessIdentifier = businessData.slug || businessData.id;
                                            navigateTo("public-profile", undefined, undefined, businessIdentifier);
                                        }}
                                        className="bg-blue-500/30 hover:bg-blue-500/40 text-white border-white/20 backdrop-blur-md px-6 font-bold h-11 rounded-2xl"
                                    >
                                        <Map className="h-4 w-4 mr-2" />
                                        View Public Store
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-2 gap-3">
                    <Card>
                        <CardContent className="p-4">
                            <p className="text-sm text-muted-foreground mb-1">Total Services</p>
                            <p className="text-3xl font-bold">{businessStats?.totalServices ?? 0}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <p className="text-sm text-muted-foreground mb-1">Approved</p>
                            <p className="text-3xl font-bold text-green-600">{businessStats?.approvedServices ?? 0}</p>
                        </CardContent>
                    </Card>
                    <Card><CardContent className="p-4">
                        <p className="text-sm text-muted-foreground mb-1">Pending</p>
                        <p className="text-3xl font-bold text-orange-600">{businessStats?.pendingServices ?? 0}</p>
                    </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <p className="text-sm text-muted-foreground mb-1">Profile Views</p>
                            <p className="text-3xl font-bold text-blue-600">{businessStats?.views ?? 0}</p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg">My Business Services</CardTitle>
                        <CardDescription>Manage all your business services and offerings</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="grid grid-cols-1 gap-3">
                            <Button
                                onClick={() => navigateTo("post-service")}
                                className="w-full bg-blue-600 hover:bg-blue-700 gap-2 h-auto py-3"
                            >
                                <div className="flex flex-col items-start text-left">
                                    <span className="flex items-center gap-2 font-bold"><PlusCircle className="h-4 w-4" /> Post Service</span>
                                    <span className="text-[10px] text-blue-100 font-normal">List a repair service</span>
                                </div>
                            </Button>
                        </div>

                        <Separator className="my-2" />

                        <Button
                            onClick={() => navigateTo("my-services")}
                            variant="outline"
                            className="w-full gap-2"
                        >
                            <Building2 className="h-4 w-4" />
                            Manage My Services & Parts
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (businessData) {
        return (
            <div className="space-y-4">
                <BusinessApplicationStatus
                    businessData={businessData}
                    onEditApplication={() => navigateTo("profile-settings-business")}
                    onWithdraw={() => navigateTo("business-entry")}
                />
            </div>
        );
    }

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Business Registration
                </CardTitle>
                <CardDescription>Register your business to offer services on Esparex</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="border rounded-lg p-4 md:p-5 bg-slate-50">
                        <h3 className="font-semibold text-slate-900 mb-3">Business Registration Process (Text + Image)</h3>
                        <div className="grid gap-4 lg:grid-cols-2">
                            <ol className="space-y-3">
                                {registrationProcessSteps.map((step, index) => {
                                    const StepIcon = step.icon;
                                    return (
                                        <li
                                            key={step.title}
                                            className="rounded-lg border bg-white p-3 flex gap-3"
                                        >
                                            <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-700 text-sm font-bold flex items-center justify-center flex-shrink-0">
                                                {index + 1}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="font-medium text-sm text-slate-900 flex items-center gap-2">
                                                    <StepIcon className="h-4 w-4 text-blue-600" />
                                                    {step.title}
                                                </div>
                                                <p className="text-xs text-slate-600 mt-1">{step.description}</p>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ol>

                            <div className="rounded-lg border bg-white p-4">
                                <p className="text-xs font-semibold uppercase tracking-wide text-blue-700 mb-3">Image View</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <div className="rounded-md border border-blue-100 bg-blue-50 p-3 text-center">
                                        <FileText className="h-5 w-5 text-blue-700 mx-auto mb-1" />
                                        <p className="text-xs font-medium text-blue-900">Fill Form</p>
                                    </div>
                                    <div className="rounded-md border border-blue-100 bg-blue-50 p-3 text-center">
                                        <Upload className="h-5 w-5 text-blue-700 mx-auto mb-1" />
                                        <p className="text-xs font-medium text-blue-900">Upload Docs</p>
                                    </div>
                                    <div className="rounded-md border border-green-100 bg-green-50 p-3 text-center">
                                        <BadgeCheck className="h-5 w-5 text-green-700 mx-auto mb-1" />
                                        <p className="text-xs font-medium text-green-900">Verification</p>
                                    </div>
                                    <div className="rounded-md border border-indigo-100 bg-indigo-50 p-3 text-center">
                                        <Building2 className="h-5 w-5 text-indigo-700 mx-auto mb-1" />
                                        <p className="text-xs font-medium text-indigo-900">Go Live</p>
                                    </div>
                                </div>
                                <div className="mt-3 flex items-center justify-center gap-1 text-[11px] text-slate-500">
                                    <span>Apply</span>
                                    <ArrowRight className="h-3.5 w-3.5" />
                                    <span>Review</span>
                                    <ArrowRight className="h-3.5 w-3.5" />
                                    <span>Approved</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h3 className="font-semibold mb-3 text-blue-900">Benefits of Business Registration:</h3>
                        <ul className="space-y-2 text-sm text-blue-700">
                            <li className="flex items-start gap-2">
                                <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-600" />
                                <span>List multiple repair and selling services</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-600" />
                                <span>Get verified business badge for trust</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-600" />
                                <span>Reach more customers in your area</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-600" />
                                <span>Manage all services from one dashboard</span>
                            </li>
                        </ul>
                    </div>
                    <Button
                        onClick={() => navigateTo("business-register")}
                        className="w-full bg-green-600 hover:bg-green-700 gap-2"
                    >
                        <Building2 className="h-4 w-4" />
                        Register Your Business Now
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
