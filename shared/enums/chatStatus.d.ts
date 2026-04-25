/**
 * ESPAREX — Chat System Enums (SSOT)
 * Shared between backend, frontend, and admin-frontend.
 */
export declare const CHAT_STATUS: {
    readonly ACTIVE: "active";
    readonly BLOCKED: "blocked";
    readonly CLOSED: "closed";
};
export type ChatStatusValue = (typeof CHAT_STATUS)[keyof typeof CHAT_STATUS];
export declare const CHAT_STATUS_VALUES: [ChatStatusValue, ...ChatStatusValue[]];
export declare const MSG_STATUS: {
    readonly SENT: "sent";
    readonly DELIVERED: "delivered";
    readonly READ: "read";
    readonly DELETED: "deleted";
};
export type MsgStatusValue = (typeof MSG_STATUS)[keyof typeof MSG_STATUS];
export declare const MSG_STATUS_VALUES: [MsgStatusValue, ...MsgStatusValue[]];
export declare const CHAT_REPORT_STATUS: {
    readonly OPEN: "open";
    readonly UNDER_REVIEW: "under_review";
    readonly RESOLVED: "resolved";
    readonly DISMISSED: "dismissed";
};
export type ChatReportStatusValue = (typeof CHAT_REPORT_STATUS)[keyof typeof CHAT_REPORT_STATUS];
export declare const CHAT_REPORT_STATUS_VALUES: [ChatReportStatusValue, ...ChatReportStatusValue[]];
export declare const CHAT_REPORT_REASON: {
    readonly SPAM: "SPAM";
    readonly SCAM: "SCAM";
    readonly ABUSE: "ABUSE";
    readonly FAKE: "FAKE";
    readonly OTHER: "OTHER";
};
export type ChatReportReasonValue = (typeof CHAT_REPORT_REASON)[keyof typeof CHAT_REPORT_REASON];
export declare const CHAT_REPORT_REASON_VALUES: [ChatReportReasonValue, ...ChatReportReasonValue[]];
