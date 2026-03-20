"use client";

import { useRouter, useParams } from 'next/navigation';
import { PublicProfile } from '@/components/business/BusinessPublicProfile';
import { useLoginCallback } from '@/hooks/useLoginCallback';

export function BusinessPageClient() {
    const router = useRouter();
    const params = useParams();
    const slug = params?.slug;

    const { navigateBack } = useLoginCallback();

    const navigateTo = (page: string, ...args: unknown[]) => {
        const adId = args[0] as number | string | undefined;
        if (page === 'ad-detail') {
            void router.push(`/ads/${adId}`);
            return;
        }
        void router.push('/');
    };

    if (!slug) return null;

    return (
        <PublicProfile
            businessId={slug as string}
            navigateTo={navigateTo}
            navigateBack={navigateBack}
            isOwner={false}
            currentUser={null}
        />
    );
}
