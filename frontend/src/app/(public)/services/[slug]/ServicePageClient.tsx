"use client";

import { useParams, notFound } from 'next/navigation';
import { ServiceDetails } from '@/components/user/ServiceDetails';
import { useAppNavigation } from '@/hooks/useAppNavigation';
import { useLoginCallback } from '@/hooks/useLoginCallback';
import { useUser } from '@/hooks/useUser';
import type { Service } from '@/api/user/services';

export function ServicePageClient({
    serviceId: initialId,
    initialService,
}: {
    serviceId?: string;
    initialService?: Service | null;
}) {
    const params = useParams();

    // Route param is [slug]; initialId is always provided by page.tsx
    const id = initialId || (params?.slug as string);

    // Validate ID
    if (!id || id === 'undefined' || id === 'null') {
        notFound();
    }

    const { navigateTo } = useAppNavigation();
    const { navigateBack, handleShowLogin } = useLoginCallback();
    const { user } = useUser();

    // Ownership is derived by ServiceDetails from the client-fetched service + user.
    // Do not compute it here from initialService — when initialService is null
    // (SSR auth failure), passing isOwner={false} would break the ?? fallback.
    return (
        <ServiceDetails
            serviceId={id}
            initialService={initialService ?? null}
            navigateTo={navigateTo}
            navigateBack={navigateBack}
            showBackButton={false}
            onShowLogin={handleShowLogin}
            user={user}
        />
    );
}
