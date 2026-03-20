import { LIFECYCLE_STATUS } from './lifecycle';

/**
 * Catalog Status Enum (Brands/Models/Categories)
 */
export const CATALOG_STATUS = {
    PENDING: LIFECYCLE_STATUS.PENDING,
    LIVE: LIFECYCLE_STATUS.LIVE,
    REJECTED: LIFECYCLE_STATUS.REJECTED,
    INACTIVE: LIFECYCLE_STATUS.INACTIVE,
    // Legacy mapping
    ACTIVE: LIFECYCLE_STATUS.LIVE,
} as const;

export type CatalogStatusValue = (typeof CATALOG_STATUS)[keyof typeof CATALOG_STATUS];
export const CATALOG_STATUS_VALUES = Object.values(CATALOG_STATUS) as [CatalogStatusValue, ...CatalogStatusValue[]];
