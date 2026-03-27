"use client";
import { useParams, notFound } from 'next/navigation';
import { ListingDetail } from '@/components/user/ListingDetail';
import { useAppNavigation } from '@/hooks/useAppNavigation';
import { isValidAdIdentifier } from "@/lib/api/user/listings";
import { useLoginCallback } from '@/hooks/useLoginCallback';
import type { Listing as Ad } from '@/lib/api/user/listings';

// Note: Title management is now handled by Server Component Metadata, 
// but we keep this hook if we want dynamic client-side updates during navigation?
// Actually, Next.js handles title via Metadata, so we can remove useAdTitle.

export function ListingPageClient({ ad }: { ad?: Ad }) {
    const params = useParams();
    const routeSlug = typeof params?.slug === 'string' ? params.slug : undefined;

    // Server payload `ad.id` is the exact DB identifier. 
    // Fall back to safely parsing the slug's tail if ad payload is missing.
    const rawIdFromSlug = routeSlug ? routeSlug.split('-').pop() : undefined;
    const id = ad?.id || rawIdFromSlug || routeSlug;

    // Validate ID
    if (!id || !isValidAdIdentifier(id)) {
        notFound();
    }

    const { navigateTo } = useAppNavigation();
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
