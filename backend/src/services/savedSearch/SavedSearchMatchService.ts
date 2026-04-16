import { Types } from 'mongoose';

export type MinimalAdRecord = {
    _id: Types.ObjectId;
    title: string;
    description?: string;
    price: number;
    status: string;
    seoSlug?: string;
    categoryId?: Types.ObjectId;

    location?: {
        locationId?: Types.ObjectId;
        city?: string;
        display?: string;
        coordinates?: {
            type: 'Point';
            coordinates: [number, number];
        };
    };
};

export type SavedSearchRecord = {
    _id: Types.ObjectId;
    query?: string;
    categoryId?: Types.ObjectId;
    locationId?: Types.ObjectId;
    coordinates?: {
        type: 'Point';
        coordinates: [number, number];
    };
    radiusKm?: number;
    priceMin?: number;
    priceMax?: number;
};

export class SavedSearchMatchService {
    /**
     * Checks if an Ad satisfies the Saved Search criteria
     */
    static matches(search: SavedSearchRecord, ad: MinimalAdRecord): boolean {
        const adText = `${ad.title || ''} ${ad.description || ''}`.toLowerCase();

        if (!this.matchesCategory(search.categoryId, ad.categoryId)) return false;
        if (!this.matchesPrice(search.priceMin, search.priceMax, ad.price)) return false;
        if (!this.matchesKeyword(search.query, adText)) return false;

        // Proximity is prioritized over locationId if coordinates are present
        if (search.coordinates && search.radiusKm && ad.location?.coordinates) {
            if (!this.matchesProximity(search, ad.location.coordinates)) return false;
        } else if (!this.matchesLocation(search.locationId, ad.location?.locationId)) {
            return false;
        }

        return true;
    }

    private static matchesProximity(search: SavedSearchRecord, adCoords: { coordinates: [number, number] }): boolean {
        if (!search.coordinates || !search.radiusKm) return true;
        
        const [searchLon, searchLat] = search.coordinates.coordinates;
        const [adLon, adLat] = adCoords.coordinates;

        const distance = this.calculateDistance(searchLat, searchLon, adLat, adLon);
        return distance <= search.radiusKm;
    }

    /**
     * Haversine formula to calculate distance between two coordinates in km
     */
    private static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    private static matchesKeyword(query: string | undefined, adText: string): boolean {
        const normalizedQuery = (query || '').trim().toLowerCase();
        if (!normalizedQuery) return true;
        const tokens = normalizedQuery.split(/\s+/).filter(Boolean);
        if (tokens.length === 0) return true;
        return tokens.every((token) => adText.includes(token));
    }

    private static matchesCategory(searchCategoryId?: Types.ObjectId, adCategoryId?: Types.ObjectId): boolean {
        if (!searchCategoryId) return true;
        if (!adCategoryId) return false;
        return searchCategoryId.toString() === adCategoryId.toString();
    }

    private static matchesLocation(searchLocationId?: Types.ObjectId, adLocationId?: Types.ObjectId): boolean {
        if (!searchLocationId) return true;
        if (!adLocationId) return false;
        return searchLocationId.toString() === adLocationId.toString();
    }

    private static matchesPrice(min?: number, max?: number, adPrice?: number): boolean {
        const price = Number(adPrice);
        if (!Number.isFinite(price)) return false;

        if (typeof min === 'number' && price < min) return false;
        if (typeof max === 'number' && price > max) return false;
        return true;
    }

    /**
     * Builds a MongoDB filter for finding candidate Saved Searches for an Ad
     */
    static buildSearchFilter(ad: MinimalAdRecord): Record<string, unknown> {
        const and: Record<string, unknown>[] = [];

        if (ad.categoryId) {
            and.push({
                $or: [
                    { categoryId: { $exists: false } },
                    { categoryId: null },
                    { categoryId: ad.categoryId }
                ]
            });
        }

        const adLocationId = ad.location?.locationId;
        if (adLocationId) {
            and.push({
                $or: [
                    { locationId: { $exists: false } },
                    { locationId: null },
                    { locationId: adLocationId }
                ]
            });
        }

        if (Number.isFinite(ad.price)) {
            and.push({
                $or: [
                    { priceMin: { $exists: false } },
                    { priceMin: null },
                    { priceMin: { $lte: ad.price } }
                ]
            });
            and.push({
                $or: [
                    { priceMax: { $exists: false } },
                    { priceMax: null },
                    { priceMax: { $gte: ad.price } }
                ]
            });
        }

        return and.length > 0 ? { $and: and } : {};
    }
}
