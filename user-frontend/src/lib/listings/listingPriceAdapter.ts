/**
 * 💰 Listing Price Adapter
 * Resolves drift between Ads (price) and Services (priceMin).
 */
import { LISTING_TYPE, type ListingTypeValue } from "@esparex/shared/enums/listingType";

export const adaptListingPrice = (
    data: Record<string, unknown>,
    listingType: ListingTypeValue
) => {
    const payload = { ...data };

    if (listingType === LISTING_TYPE.SERVICE) {
        // Services use priceMin internally but UI uses canonical 'price'
        payload.priceMin = payload.price;
        // Optional: payload.price = undefined; // If backend strictly rejects 'price' on services
    }

    return payload;
};

export const normalizeListingPrice = (
    data: Record<string, unknown>,
    listingType: ListingTypeValue
) => {
    if (listingType === LISTING_TYPE.SERVICE) {
        return data.priceMin ?? data.price ?? 0;
    }
    return data.price ?? 0;
};
