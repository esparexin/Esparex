"use client";
import { useCallback } from 'react';
import { useParams, notFound, useRouter } from 'next/navigation';
import { ListingDetail } from '@/components/user/ListingDetail';
import type { Listing as Ad } from '@/lib/api/user/listings';
import { useLoginCallback } from '@/hooks/useLoginCallback';

import { getPageRoute, type SellerType, type UserPage } from '@/lib/routeUtils';
import { parseListingSlugParam } from '@/lib/slug';

const isValidAdIdentifier = (id: string) => /^[0-9a-fA-F]{24}$/.test(id);

export function ListingPageClient({ ad }: { ad?: Ad }) {
    const params = useParams();
    const router = useRouter();
    const routeSlug = typeof params?.slug === 'string' ? params.slug : undefined;

    // Server payload `ad.id` is the exact DB identifier. 
    // Fall back to SSOT slug parser if ad payload is missing.
    const rawIdFromSlug = routeSlug ? parseListingSlugParam(routeSlug).id : undefined;
    const id = ad?.id ? String(ad.id) : (rawIdFromSlug || routeSlug);

    // Validate ID
    if (!id || !isValidAdIdentifier(id)) {
        notFound();
    }

    // Public listing detail is read-only, so it should not depend on the
    // unsaved-changes navigation context used by form flows.
    const navigateTo = useCallback((
        page: UserPage,
        adId?: string | number,
        category?: string,
        businessId?: string,
        serviceId?: string,
        sellerId?: string,
        sellerType?: SellerType
    ) => {
        const path = getPageRoute(page, {
            adId,
            serviceId,
            category,
            businessId,
            businessSlug: businessId,
            sellerId,
            sellerType,
        });

        void router.push(path);
    }, [router]);
    const { navigateBack } = useLoginCallback();

    return (
        <ListingDetail
            adId={id}
            initialAd={ad} // Pass pre-fetched data
            navigateTo={navigateTo}
            navigateBack={navigateBack}
        />
    );
}
