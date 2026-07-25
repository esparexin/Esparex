import { LIFECYCLE_STATUS } from '../../common/enums/lifecycle';

/**
 * Catalog Status Enum (Brands/Models/Categories)
 * @deprecated Catalog enablement is SSOT-governed by `isActive: boolean` and `approvalStatus`.
 */
export const CATALOG_STATUS = {
    PENDING: LIFECYCLE_STATUS.PENDING,
    LIVE: LIFECYCLE_STATUS.LIVE,
    REJECTED: LIFECYCLE_STATUS.REJECTED,
    INACTIVE: LIFECYCLE_STATUS.INACTIVE,
    /** @deprecated Catalog entities use `isActive: boolean` instead of `status: "live"`. */
    ACTIVE: LIFECYCLE_STATUS.LIVE,
} as const;

export type CatalogStatusValue = (typeof CATALOG_STATUS)[keyof typeof CATALOG_STATUS];
export const CATALOG_STATUS_VALUES = Object.values(CATALOG_STATUS) as [CatalogStatusValue, ...CatalogStatusValue[]];

