/**
 * Ad Report Reason Enum
 */
export const REPORT_REASON = {
    SPAM: 'SPAM',
    SCAM: 'SCAM',
    PROHIBITED_ITEM: 'PROHIBITED_ITEM',
    OFFENSIVE_CONTENT: 'OFFENSIVE_CONTENT',
    MISLEADING_INFO: 'MISLEADING_INFO',
    SOLD_ELSEWHERE: 'SOLD_ELSEWHERE',
    OTHER: 'OTHER'
} as const;

export type ReportReasonValue = (typeof REPORT_REASON)[keyof typeof REPORT_REASON];
export const REPORT_REASON_VALUES = Object.values(REPORT_REASON) as [ReportReasonValue, ...ReportReasonValue[]];
