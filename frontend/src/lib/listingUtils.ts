import { buildPublicListingDetailRoute } from "./publicListingRoutes";

/**
 * Interface representing the minimal data needed for listing routing.
 */
export interface ListingLinkData {
    id: string | number;
    title: string;
    listingType?: string;
}

/**
 * Returns the correct absolute URL for a listing based on its type.
 * Ensures consistent routing for Ads, Services, and Spare Parts.
 */
export function getListingHref(listing: ListingLinkData): string {
    return buildPublicListingDetailRoute({
        id: listing.id,
        listingType: listing.listingType,
        title: listing.title,
    });
}
