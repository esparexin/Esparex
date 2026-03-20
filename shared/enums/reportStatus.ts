/**
 * User Report Status Enum
 */

export const REPORT_STATUS = {
    OPEN: 'open',
    PENDING: 'pending',
    REVIEWED: 'reviewed',
    RESOLVED: 'resolved',
    DISMISSED: 'dismissed'
} as const;

export type ReportStatusValue = (typeof REPORT_STATUS)[keyof typeof REPORT_STATUS];
export const REPORT_STATUS_VALUES = Object.values(REPORT_STATUS) as [ReportStatusValue, ...ReportStatusValue[]];
