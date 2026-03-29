"use client";
import { useCallback } from 'react';
import { useParams, notFound, useRouter } from 'next/navigation';
import { ListingDetail } from '@/components/user/ListingDetail';
import { isValidAdIdentifier } from "@/lib/api/user/listings";
import { useLoginCallback } from '@/hooks/useLoginCallback';
import type { Listing as Ad } from '@/lib/api/user/listings';
import { getPageRoute, type SellerType, type UserPage } from '@/lib/routeUtils';

// Note: Title management is now handled by Server Component Metadata, 
// but we keep this hook if we want dynamic client-side updates during navigation?
// Actually, Next.js handles title via Metadata, so we can remove useAdTitle.

export function ListingPageClient({ ad }: { ad?: Ad }) {
    const params = useParams();
    const router = useRouter();
    const routeSlug = typeof params?.slug === 'string' ? params.slug : undefined;

    // Server payload `ad.id` is the exact DB identifier. 
    // Fall back to safely parsing the slug's tail if ad payload is missing.
    const rawIdFromSlug = routeSlug ? routeSlug.split('-').pop() : undefined;
    const id = ad?.id || rawIdFromSlug || routeSlug;

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
            showBackButton={false}
        />
    );
}
