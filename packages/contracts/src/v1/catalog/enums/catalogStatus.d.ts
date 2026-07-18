/**
 * Catalog Status Enum (Brands/Models/Categories)
 */
export declare const CATALOG_STATUS: {
    readonly PENDING: "pending";
    readonly LIVE: "live";
    readonly REJECTED: "rejected";
    readonly INACTIVE: "inactive";
    readonly ACTIVE: "live";
};
export type CatalogStatusValue = (typeof CATALOG_STATUS)[keyof typeof CATALOG_STATUS];
export declare const CATALOG_STATUS_VALUES: [CatalogStatusValue, ...CatalogStatusValue[]];
