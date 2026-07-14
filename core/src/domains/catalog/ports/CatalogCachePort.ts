export interface InvalidateCatalogCacheOptions {
    categoryIds?: string[];
    brandIds?: string[];
}

export interface CatalogCachePort {
    /**
     * Invalidates the catalog caches, optionally scoped by specific categories or brands.
     * If no options are provided, invalidates the entire catalog cache.
     */
    invalidateCatalogCache(opts?: InvalidateCatalogCacheOptions): Promise<void>;
}
