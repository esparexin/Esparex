export interface ListingsCachePort {
    /**
     * Invalidates all listing-related feed caches (homepage, spotlight, searches, etc.)
     */
    invalidateAdFeedCaches(): Promise<void>;

    /**
     * Invalidates a single listing's detail cache
     */
    invalidatePublicAdCache(adId: string): Promise<void>;
}
