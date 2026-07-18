/**
 * User Plan Status Enum
 */
export declare const PLAN_STATUS: {
    readonly ACTIVE: "active";
    readonly EXPIRED: "expired";
    readonly SUSPENDED: "suspended";
};
export type PlanStatusValue = (typeof PLAN_STATUS)[keyof typeof PLAN_STATUS];
export declare const PLAN_STATUS_VALUES: [PlanStatusValue, ...PlanStatusValue[]];
