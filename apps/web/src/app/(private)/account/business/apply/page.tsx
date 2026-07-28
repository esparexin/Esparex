"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@esparex/ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, LayoutDashboard, Wrench, Phone } from "@/icons/IconRegistry";
import { PageContainer } from "@/components/ui/PageContainer";
import { BusinessProfileFlow } from "@/components/user/business-registration/BusinessProfileFlow";
import { BusinessApplicationStatus } from "@/components/user/profile/BusinessApplicationStatus";
import { useCurrentUser as useUser } from "@/hooks/useCurrentUser";
import { useBusiness } from "@/hooks/useBusiness";
import { normalizeBusinessStatus } from "@/lib/status/statusNormalization";
import { mapErrorToMessage } from "@/lib/errorMapper";

export default function BusinessApplyPage() {
    const router = useRouter();
    const { user, refreshUser, loading: authLoading } = useUser();
    const { businessData, isLoading: businessLoading, isFetched: businessFetched, error: businessError, retry: retryBusiness } = useBusiness(user, undefined, {
        includeStats: false,
        silent: true,
    });

    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        document.title = "Business Registration & Status | Esparex";
    }, []);

    const isHydrated = !authLoading && !businessLoading && businessFetched;

    if (!isHydrated) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
            </div>
        );
    }

    if (businessError) {
        return (
            <PageContainer variant="compact" className="py-12">
                <Card className="rounded-2xl border-slate-200 bg-white p-6 shadow-sm">
                    <CardHeader className="p-0 mb-4">
                        <CardTitle className="text-lg font-semibold text-foreground">Unable to verify business status</CardTitle>
                        <CardDescription className="mt-1 text-sm leading-6 text-foreground-tertiary">
                            {mapErrorToMessage(businessError, "We couldn't verify your current business status. Try again.")}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Button className="w-full" onClick={() => retryBusiness()}>
                            Retry Verification
                        </Button>
                    </CardContent>
                </Card>
            </PageContainer>
        );
    }

    // Require mobile verification before registration
    if (user && !user.isPhoneVerified) {
        return (
            <PageContainer variant="compact" className="py-12 space-y-4">
                <Card className="rounded-3xl border-amber-200 bg-amber-50/50 p-6">
                    <CardHeader className="p-0 mb-3 flex flex-row items-center gap-3">
                        <Phone className="h-6 w-6 text-amber-600 shrink-0" />
                        <div>
                            <CardTitle className="text-base font-bold text-amber-900">Mobile Verification Required</CardTitle>
                            <CardDescription className="text-xs text-amber-700">Please verify your phone number via OTP before submitting a business application.</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 pt-2">
                        <Button
                            onClick={() => router.push("/account/profile")}
                            className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl"
                        >
                            Verify Mobile Number
                        </Button>
                    </CardContent>
                </Card>
            </PageContainer>
        );
    }

    const status = normalizeBusinessStatus(businessData?.status || user?.businessStatus, "pending");
    const hasExistingBusiness = Boolean(businessData?.id || user?.businessId);

    // If user clicked edit to update application details (pending or rejected status)
    if (isEditing) {
        return (
            <BusinessProfileFlow
                mode={hasExistingBusiness ? "edit" : "registration"}
                user={user}
                initialBusiness={businessData}
                onRefreshUser={async () => {
                    await refreshUser();
                    await retryBusiness();
                    setIsEditing(false);
                }}
                onComplete={async () => {
                    await refreshUser();
                    await retryBusiness();
                    setIsEditing(false);
                }}
                onClose={() => setIsEditing(false)}
            />
        );
    }

    // State 1: Approved Business (Informational View)
    if (status === "live" || status === "active") {
        return (
            <PageContainer variant="compact" className="py-12 space-y-4">
                <Card className="rounded-3xl border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50 p-6 shadow-sm">
                    <CardHeader className="p-0 mb-4 flex flex-row items-start gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shrink-0">
                            <CheckCircle2 className="h-6 w-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <CardTitle className="text-xl font-bold text-slate-900">{businessData?.name || "Verified Business"}</CardTitle>
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                                    <CheckCircle2 className="h-3 w-3" /> Verified
                                </span>
                            </div>
                            <CardDescription className="text-sm text-slate-600 mt-1">
                                Your business application is approved and active on Esparex.
                            </CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 space-y-3 pt-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <Button
                                onClick={() => router.push("/account/business")}
                                className="h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-2"
                            >
                                <LayoutDashboard className="h-4 w-4" /> Go to Business Hub
                            </Button>
                            <Button
                                onClick={() => router.push("/account/services")}
                                variant="outline"
                                className="h-11 rounded-xl border-slate-200 font-semibold gap-2"
                            >
                                <Wrench className="h-4 w-4" /> Manage Services & Parts
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </PageContainer>
        );
    }

    // State 2 & 3: Pending or Rejected Business Application Status
    if (hasExistingBusiness && (status === "pending" || status === "rejected" || status === "suspended")) {
        return (
            <PageContainer variant="compact" className="py-12">
                <BusinessApplicationStatus
                    businessData={businessData}
                    onEditApplication={() => setIsEditing(true)}
                    navigateToBusinessTab={() => router.push("/account/business")}
                    onWithdraw={async () => {
                        await refreshUser();
                        await retryBusiness();
                    }}
                />
            </PageContainer>
        );
    }

    // State 4: Fresh Registration Flow (No application)
    return (
        <BusinessProfileFlow
            mode="registration"
            user={user}
            onRefreshUser={async () => {
                await refreshUser();
                await retryBusiness();
            }}
            onComplete={async () => {
                await refreshUser();
                await retryBusiness();
            }}
            onClose={() => router.push("/account/business")}
        />
    );
}
