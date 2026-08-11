"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Container } from "@esparex/ui";
import { PageSection } from "@/components/layout";
import { CheckCircle2, LayoutDashboard, Wrench, Phone } from "@/icons/IconRegistry";
import { BusinessProfileFlow } from "@/components/user/business-registration/BusinessProfileFlow";
import { BusinessApplicationStatus } from "@/components/user/profile/BusinessApplicationStatus";
import { useCurrentUser as useUser } from "@/hooks/useCurrentUser";
import { useBusiness } from "@/hooks/useBusiness";
import { normalizeBusinessStatus } from "@/lib/status/statusNormalization";
import { mapErrorToMessage } from "@/lib/errorMapper";

export default function BusinessApplyPage() {
    const router = useRouter();
    const { user, refreshUser, updateUser, loading: authLoading } = useUser();
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
            // ui-guard-ignore: nested-container Early-return branch — each Container is mutually exclusive, never nested
            <Container variant="md" className="py-8 sm:py-12">
                <PageSection
                    variant="bordered"
                    title="Unable to verify business status"
                    subtitle={mapErrorToMessage(businessError, "We couldn't verify your current business status. Try again.")}
                >
                    <Button className="w-full mt-2" onClick={() => retryBusiness()}>
                        Retry Verification
                    </Button>
                </PageSection>
            </Container>
        );
    }

    // Require mobile verification before registration
    if (user && !user.isPhoneVerified) {
        return (
            // ui-guard-ignore: nested-container Early-return branch — mutually exclusive Container, never nested
            <Container variant="md" className="py-8 sm:py-12">
                <PageSection
                    variant="bordered"
                    className="border-amber-200 bg-amber-50/40"
                    title={
                        <div className="flex items-center gap-2 text-amber-900">
                            <Phone className="h-5 w-5 text-amber-600 shrink-0" />
                            <span>Mobile Verification Required</span>
                        </div>
                    }
                    subtitle="Please verify your phone number via OTP before submitting a business application."
                >
                    <Button
                        onClick={() => router.push("/account/profile")}
                        className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl mt-2"
                    >
                        Verify Mobile Number
                    </Button>
                </PageSection>
            </Container>
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
            // ui-guard-ignore: nested-container Early-return branch — mutually exclusive Container, never nested
            <Container variant="md" className="py-8 sm:py-12 space-y-4">
                <PageSection
                    variant="bordered"
                    className="border-emerald-200/80 bg-emerald-50/40"
                    title={
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                            <span className="text-xl font-bold text-slate-900">{businessData?.name || "Verified Business"}</span>
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                                Verified
                            </span>
                        </div>
                    }
                    subtitle="Your business application is approved and active on Esparex."
                >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
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
                </PageSection>
            </Container>
        );
    }

    // State 2 & 3: Pending or Rejected Business Application Status
    if (hasExistingBusiness && (status === "pending" || status === "rejected" || status === "suspended")) {
        return (
            // ui-guard-ignore: nested-container Early-return branch — mutually exclusive Container, never nested
            <Container variant="md" className="py-8 sm:py-12">
                <BusinessApplicationStatus
                    businessData={businessData}
                    onEditApplication={() => setIsEditing(true)}
                    navigateToBusinessTab={() => router.push("/account/business")}
                    onWithdraw={async () => {
                        await refreshUser();
                        await retryBusiness();
                    }}
                />
            </Container>
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
                if (user) {
                    updateUser({
                        ...user,
                        businessStatus: "pending",
                    });
                }
                await refreshUser();
                await retryBusiness();
            }}
            onClose={() => router.push("/account/business")}
        />
    );
}

