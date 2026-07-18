/**
 * Service Status Enum — Unified Reference
 * Applied to: Services
 */
export declare const SERVICE_STATUS: {
    readonly PENDING: "pending";
    readonly LIVE: "live";
    readonly REJECTED: "rejected";
    readonly EXPIRED: "expired";
    readonly DEACTIVATED: "deactivated";
};
export type ServiceStatusValue = (typeof SERVICE_STATUS)[keyof typeof SERVICE_STATUS];
/** Tuple of all valid service status values */
export declare const SERVICE_STATUS_VALUES: [ServiceStatusValue, ...ServiceStatusValue[]];
