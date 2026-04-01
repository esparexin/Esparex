import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Building2,
    CheckCircle2,
    Globe,
    Mail,
    MapPin,
    Phone,
    Wrench,
} from "lucide-react";
import { type Business } from "@/lib/api/user/businesses";
import { normalizeBusinessStatus } from "@/lib/status/statusNormalization";
import { BusinessApplicationStatus } from "../BusinessApplicationStatus";

interface BusinessTabProps {
    businessData: Business | null;
    businessStats?: { totalServices: number; approvedServices: number; pendingServices: number; views: number };
    isLoading?: boolean;
    isFetched?: boolean;
    navigateTo: (page: string, adId?: string | number, category?: string, sellerIdOrBusinessId?: string) => void;
}

export function BusinessTab({
    businessData,
    businessStats,
    isLoading,
    isFetched,
    navigateTo,
}: BusinessTabProps) {
    if (isLoading && !isFetched) {
        return (
            <div className="space-y-4 animate-pulse">
                <div className="h-48 rounded-3xl bg-slate-100" />
                <div className="grid grid-cols-2 gap-3">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-24 rounded-2xl bg-slate-100" />
                    ))}
                </div>
            </div>
        );
    }

    const status = businessData
        ? normalizeBusinessStatus(businessData.status, "pending")
        : "pending";

    if (businessData && status === "live") {
        return (
            <div className="space-y-4">
                <Card className="rounded-3xl border-0 bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl">
                    <CardContent className="space-y-6 p-6 md:p-8">
                        <div className="flex items-start gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
                                <Building2 className="h-7 w-7" />
                            </div>
                            <div className="min-w-0 space-y-2">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h2 className="text-2xl font-bold tracking-tight">{businessData.businessName || businessData.name}</h2>
                                    <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-blue-50">
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                        Verified business
                                    </span>
                                </div>
                                <p className="max-w-2xl text-sm leading-6 text-blue-50/90">
                                    Keep your business profile accurate so customers can find, trust, and contact you quickly.
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2">
                            <div className="flex items-start gap-3 rounded-2xl bg-white/10 px-4 py-3">
                                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-blue-100" />
                                <span className="text-sm leading-6 text-blue-50">
                                    {businessData.location?.display || businessData.location?.address || "Location not available"}
                                </span>
                            </div>
                            <div className="flex items-start gap-3 rounded-2xl bg-white/10 px-4 py-3">
                                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-blue-100" />
                                <span className="text-sm leading-6 text-blue-50">
                                    +91 {businessData.contactNumber || businessData.mobile}
                                </span>
                            </div>
                            <div className="flex items-start gap-3 rounded-2xl bg-white/10 px-4 py-3">
                                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-blue-100" />
                                <span className="text-sm leading-6 text-blue-50">{businessData.email}</span>
                            </div>
                            <div className="flex items-start gap-3 rounded-2xl bg-white/10 px-4 py-3">
                                <Globe className="mt-0.5 h-4 w-4 shrink-0 text-blue-100" />
                                <span className="text-sm leading-6 text-blue-50">{businessData.website || "Website not added"}</span>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <Button
                                onClick={() => navigateTo("profile-settings-business")}
                                className="h-11 rounded-xl bg-white px-5 font-semibold text-blue-700 hover:bg-blue-50"
                            >
                                Edit Business Profile
                            </Button>
                            <Button
                                onClick={() => navigateTo("public-profile", undefined, undefined, businessData.slug || businessData.id)}
                                variant="secondary"
                                className="h-11 rounded-xl border border-white/20 bg-white/10 px-5 font-semibold text-white hover:bg-white/15"
                            >
                                View Public Store
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-2 gap-3">
                    <Card className="rounded-2xl">
                        <CardContent className="p-4">
                            <p className="text-sm text-slate-500">Total Services</p>
                            <p className="mt-1 text-2xl font-bold text-slate-900">{businessStats?.totalServices ?? 0}</p>
                        </CardContent>
                    </Card>
                    <Card className="rounded-2xl">
                        <CardContent className="p-4">
                            <p className="text-sm text-slate-500">Approved</p>
                            <p className="mt-1 text-2xl font-bold text-emerald-600">{businessStats?.approvedServices ?? 0}</p>
                        </CardContent>
                    </Card>
                    <Card className="rounded-2xl">
                        <CardContent className="p-4">
                            <p className="text-sm text-slate-500">Pending</p>
                            <p className="mt-1 text-2xl font-bold text-amber-600">{businessStats?.pendingServices ?? 0}</p>
                        </CardContent>
                    </Card>
                    <Card className="rounded-2xl">
                        <CardContent className="p-4">
                            <p className="text-sm text-slate-500">Profile Views</p>
                            <p className="mt-1 text-2xl font-bold text-blue-600">{businessStats?.views ?? 0}</p>
                        </CardContent>
                    </Card>
                </div>

                <Card className="rounded-3xl gap-0">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Wrench className="h-5 w-5 text-blue-600" />
                            Business services
                        </CardTitle>
                        <CardDescription>Post new service listings or manage the ones already attached to your business.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3 sm:flex-row">
                        <Button onClick={() => navigateTo("post-service")} className="h-11 rounded-xl bg-blue-600 px-5 font-semibold hover:bg-blue-700">
                            Post Service
                        </Button>
                        <Button onClick={() => navigateTo("my-services")} variant="outline" className="h-11 rounded-xl px-5 font-semibold">
                            Manage Services & Parts
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (businessData) {
        return (
            <BusinessApplicationStatus
                businessData={businessData}
                onEditApplication={() => navigateTo("profile-settings-business")}
                onWithdraw={() => navigateTo("business-register")}
            />
        );
    }

    return (
        <Card className="rounded-3xl gap-0">
            <CardHeader className="space-y-2">
                <CardTitle className="flex items-center gap-2 text-base">
                    <Building2 className="h-5 w-5 text-blue-600" />
                    Register your business
                </CardTitle>
                <CardDescription>
                    Create one verified business profile to list services, spare parts, and contact details in one place.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                    <ul className="space-y-2 text-sm text-blue-900">
                        <li className="flex items-start gap-2">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                            <span>Get a verified public business profile customers can trust.</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                            <span>Post services and manage business listings from one workspace.</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                            <span>Use your real address and review documents once, then keep the profile updated.</span>
                        </li>
                    </ul>
                </div>

                <Button
                    onClick={() => navigateTo("business-register")}
                    className="h-11 w-full rounded-xl bg-blue-600 font-semibold hover:bg-blue-700"
                >
                    Start business registration
                </Button>
            </CardContent>
        </Card>
    );
}
