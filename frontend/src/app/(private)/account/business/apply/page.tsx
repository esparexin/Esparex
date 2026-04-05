"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { notify } from "@/lib/notify";
import { Button } from "@/components/ui/button";

import { BusinessProfileFlow } from "@/components/user/business-registration/BusinessProfileFlow";
import { useUser } from "@/hooks/useUser";
import { useBusiness } from "@/hooks/useBusiness";
import { canRegisterBusiness } from "@/guards/businessGuards";
import { normalizeBusinessStatus } from "@/lib/status/statusNormalization";
import { mapErrorToMessage } from "@/lib/errorMapper";

export default function BusinessApplyPage() {
    const router = useRouter();
    const { user, refreshUser, loading: authLoading } = useUser();
    const { businessData, isLoading: businessLoading, isFetched: businessFetched, error: businessError, retry: retryBusiness } = useBusiness(user, undefined, {
        includeStats: false,
        silent: true,
    });
    
    const isHydrated = !authLoading && !businessLoading && businessFetched;

    useEffect(() => {
        document.title = "Register Your Business | Esparex";
        if (businessError || !isHydrated || !user) return;

        const status = normalizeBusinessStatus(businessData?.status || user?.businessStatus, "pending");
        const hasPendingApplication = status === "pending" && Boolean(businessData?.id || user?.businessId);

        if (status === "live" || hasPendingApplication) {
            notify.info("You already have a registered business or a pending application");
            void router.replace("/account/business");
            return;
        }

        // Check phone verification first for clear messaging
        if (user && !user.isPhoneVerified) {
            notify.warning("Please verify your mobile number before registering a business.");
            void router.replace("/account/profile");
            return;
        }

        if (user && !canRegisterBusiness({ ...user, businessStatus: status as any })) {
            notify.warning("You cannot register a business at this time.");
            void router.replace("/account/business");
            return;
        }
    }, [businessError, isHydrated, user, businessData, router]);

    const handleUpdateUser = async () => {
        await refreshUser();
    };

    if (!isHydrated) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
            </div>
        );
    }

    if (businessError) {
        return (
            <div className="flex min-h-screen items-center justify-center px-4">
                <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h1 className="text-lg font-semibold text-slate-900">Unable to verify business status</h1>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                        {mapErrorToMessage(businessError, "We couldn't verify your current business status. Try again.")}
                    </p>
                    <Button className="mt-5 w-full" onClick={() => retryBusiness()}>
                        Retry
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <BusinessProfileFlow
            mode="registration"
            user={user}
            onRefreshUser={handleUpdateUser}
            onClose={() => void router.push("/account/business")}
        />
    );
}
