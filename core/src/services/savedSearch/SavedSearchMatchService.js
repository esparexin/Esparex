"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SavedSearchMatchService = void 0;
class SavedSearchMatchService {
    /**
     * Checks if an Ad satisfies the Saved Search criteria
     */
    static matches(search, ad) {
        const adText = `${ad.title || ''} ${ad.description || ''}`.toLowerCase();
        if (!this.matchesCategory(search.categoryId, ad.categoryId))
            return false;
        if (!this.matchesPrice(search.priceMin, search.priceMax, ad.price))
            return false;
        if (!this.matchesKeyword(search.query, adText))
            return false;
        // Proximity is prioritized over locationId if coordinates are present
        if (search.coordinates && search.radiusKm && ad.location?.coordinates) {
            if (!this.matchesProximity(search, ad.location.coordinates))
                return false;
        }
        else if (!this.matchesLocation(search.locationId, ad.location?.locationId)) {
            return false;
        }
        return true;
    }
    static matchesProximity(search, adCoords) {
        if (!search.coordinates || !search.radiusKm)
            return true;
        const [searchLon, searchLat] = search.coordinates.coordinates;
        const [adLon, adLat] = adCoords.coordinates;
        const distance = this.calculateDistance(searchLat, searchLon, adLat, adLon);
        return distance <= search.radiusKm;
    }
    /**
     * Haversine formula to calculate distance between two coordinates in km
     */
    static calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
    static matchesKeyword(query, adText) {
        const normalizedQuery = (query || '').trim().toLowerCase();
        if (!normalizedQuery)
            return true;
        const tokens = normalizedQuery.split(/\s+/).filter(Boolean);
        if (tokens.length === 0)
            return true;
        return tokens.every((token) => adText.includes(token));
    }
    static matchesCategory(searchCategoryId, adCategoryId) {
        if (!searchCategoryId)
            return true;
        if (!adCategoryId)
            return false;
        return searchCategoryId.toString() === adCategoryId.toString();
    }
    static matchesLocation(searchLocationId, adLocationId) {
        if (!searchLocationId)
            return true;
        if (!adLocationId)
            return false;
        return searchLocationId.toString() === adLocationId.toString();
    }
    static matchesPrice(min, max, adPrice) {
        const price = Number(adPrice);
        if (!Number.isFinite(price))
            return false;
        if (typeof min === 'number' && price < min)
            return false;
        if (typeof max === 'number' && price > max)
            return false;
        return true;
    }
    /**
     * Builds a MongoDB filter for finding candidate Saved Searches for an Ad
     */
    static buildSearchFilter(ad) {
        const and = [];
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
exports.SavedSearchMatchService = SavedSearchMatchService;
//# sourceMappingURL=SavedSearchMatchService.js.map