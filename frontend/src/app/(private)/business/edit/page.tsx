"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { notify } from "@/lib/notify";

import { useAuth } from '@/context/AuthContext';
import { normalizeBusinessStatus } from '@/lib/status/statusNormalization';

import { useBusiness } from '@/hooks/useBusiness';
import { BusinessEditFlow } from '@/components/user/BusinessEditFlow';

export default function BusinessEditPage() {
    const router = useRouter();
    const { user, refreshUser, status: authStatus } = useAuth();
    const { businessData, isLoading: businessLoading, isFetched: businessFetched } = useBusiness(user);
    
    const businessStatus = normalizeBusinessStatus(businessData?.status || user?.businessStatus, 'pending');
    const hasBusinessId = Boolean(businessData?.id || user?.businessId);
    
    const isHydrated = authStatus !== 'loading' && !businessLoading && businessFetched;
    const isAuthorized = !!user && hasBusinessId && businessStatus !== 'suspended';

    useEffect(() => {
        if (!isHydrated || !user) return;

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
    }, [isHydrated, user, hasBusinessId, businessStatus, router]);

    if (!isHydrated || !isAuthorized) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
            </div>
        );
    }

    return (
        <BusinessEditFlow
            user={user}
            onUpdateUser={refreshUser}
            onComplete={() => void router.push('/account/business')}
        />
    );
}
