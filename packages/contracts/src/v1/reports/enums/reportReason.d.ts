/**
 * Ad Report Reason Enum
 */
export declare const REPORT_REASON: {
    readonly SPAM: "SPAM";
    readonly SCAM: "SCAM";
    readonly PROHIBITED_ITEM: "PROHIBITED_ITEM";
    readonly OFFENSIVE_CONTENT: "OFFENSIVE_CONTENT";
    readonly MISLEADING_INFO: "MISLEADING_INFO";
    readonly SOLD_ELSEWHERE: "SOLD_ELSEWHERE";
    readonly OTHER: "OTHER";
};
export type ReportReasonValue = (typeof REPORT_REASON)[keyof typeof REPORT_REASON];
export declare const REPORT_REASON_VALUES: [ReportReasonValue, ...ReportReasonValue[]];
