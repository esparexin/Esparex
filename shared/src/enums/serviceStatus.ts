import { LIFECYCLE_STATUS } from './lifecycle';

/**
 * Service Status Enum — Unified Reference
 * Applied to: Services
 */
export const SERVICE_STATUS = {
    PENDING: LIFECYCLE_STATUS.PENDING,
    LIVE: LIFECYCLE_STATUS.LIVE,
    REJECTED: LIFECYCLE_STATUS.REJECTED,
    EXPIRED: LIFECYCLE_STATUS.EXPIRED,
    DEACTIVATED: LIFECYCLE_STATUS.DEACTIVATED,
} as const;

export type ServiceStatusValue = (typeof SERVICE_STATUS)[keyof typeof SERVICE_STATUS];

/** Tuple of all valid service status values */
export const SERVICE_STATUS_VALUES = Object.values(SERVICE_STATUS) as [ServiceStatusValue, ...ServiceStatusValue[]];
