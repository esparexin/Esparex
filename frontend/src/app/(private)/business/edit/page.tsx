"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { notify } from "@/lib/notify";
import { Button } from "@/components/ui/button";

import { normalizeBusinessStatus } from '@/lib/status/statusNormalization';

import { useBusiness } from '@/hooks/useBusiness';
import { useUser } from '@/hooks/useUser';
import { BusinessProfileFlow } from '@/components/user/business-registration/BusinessProfileFlow';
import { mapErrorToMessage } from '@/lib/errorMapper';

export default function BusinessEditPage() {
    const router = useRouter();
    const { user, refreshUser, loading: authLoading } = useUser();
    const { businessData, isLoading: businessLoading, isFetched: businessFetched, error: businessError, retry: retryBusiness } = useBusiness(user, undefined, {
        includeStats: false,
        silent: true,
    });
    
    const businessStatus = normalizeBusinessStatus(businessData?.status || user?.businessStatus, 'pending');
    const hasBusinessId = Boolean(businessData?.id || user?.businessId);
    
    const isHydrated = !authLoading && !businessLoading && businessFetched;
    const isAuthorized = !!user && hasBusinessId && businessStatus !== 'suspended';

    useEffect(() => {
        if (businessError || !isHydrated || !user) return;

        if (!hasBusinessId) {
            notify.error("You need to register a business first");
            void router.push('/account/business/apply');
            return;
        }

        if (businessStatus === 'suspended') {
            notify.error("Your business account is suspended and cannot be edited.");
            void router.push('/account/business');
            return;
        }
    }, [businessError, isHydrated, user, hasBusinessId, businessStatus, router]);

    if (businessError) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center px-4">
                <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h1 className="text-lg font-semibold text-slate-900">Unable to load business profile</h1>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                        {mapErrorToMessage(businessError, "We couldn't load your business profile. Try again.")}
                    </p>
                    <Button className="mt-5 w-full" onClick={() => retryBusiness()}>
                        Retry
                    </Button>
                </div>
            </div>
        );
    }

    if (!isHydrated || !isAuthorized) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
            </div>
        );
    }

    return (
        <BusinessProfileFlow
            mode="edit"
            user={user}
            initialBusiness={businessData}
            onRefreshUser={refreshUser}
            onComplete={() => void router.push('/account/business')}
        />
    );
}
