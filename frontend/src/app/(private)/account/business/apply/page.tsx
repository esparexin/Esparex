"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { notify } from "@/lib/notify";

import { BusinessProfileFlow } from "@/components/user/business-registration/BusinessProfileFlow";
import { useUser } from "@/hooks/useUser";
import { useBusiness } from "@/hooks/useBusiness";
import { canRegisterBusiness } from "@/guards/businessGuards";
import { normalizeBusinessStatus } from "@/lib/status/statusNormalization";

export default function BusinessApplyPage() {
    const router = useRouter();
    const { user, refreshUser, loading: authLoading } = useUser();
    const { businessData, isLoading: businessLoading, isFetched: businessFetched } = useBusiness(user);
    
    const isHydrated = !authLoading && !businessLoading && businessFetched;

    useEffect(() => {
        document.title = "Register Your Business | Esparex";
        if (!isHydrated || !user) return;

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
    }, [isHydrated, user, businessData, router]);

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

    return (
        <BusinessProfileFlow
            mode="registration"
            user={user}
            onRefreshUser={handleUpdateUser}
            onClose={() => void router.push("/account/business")}
        />
    );
}
