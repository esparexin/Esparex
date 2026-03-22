/**
 * 💰 Listing Price Adapter
 * Resolves drift between Ads (price) and Services (priceMin).
 */
import type { FormPlacement } from "@shared/enums/listingType";

export const adaptListingPrice = (
    data: any,
    listingType: FormPlacement
) => {
    const payload = { ...data };

    if (listingType === 'postservice') {
        // Services use priceMin internally but UI uses canonical 'price'
        payload.priceMin = payload.price;
        // Optional: payload.price = undefined; // If backend strictly rejects 'price' on services
    }

    return payload;
};

export const normalizeListingPrice = (
    data: any,
    listingType: FormPlacement
) => {
    if (listingType === 'postservice') {
        return data.priceMin ?? data.price ?? 0;
    }
    return data.price ?? 0;
};
