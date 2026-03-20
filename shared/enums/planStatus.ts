/**
 * User Plan Status Enum
 */
export const PLAN_STATUS = {
    ACTIVE: 'active',
    EXPIRED: 'expired',
    SUSPENDED: 'suspended'
} as const;

export type PlanStatusValue = (typeof PLAN_STATUS)[keyof typeof PLAN_STATUS];
export const PLAN_STATUS_VALUES = Object.values(PLAN_STATUS) as [PlanStatusValue, ...PlanStatusValue[]];
