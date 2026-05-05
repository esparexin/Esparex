/**
 * User Report Status Enum
 */
export declare const REPORT_STATUS: {
    readonly OPEN: "open";
    readonly PENDING: "pending";
    readonly REVIEWED: "reviewed";
    readonly RESOLVED: "resolved";
    readonly DISMISSED: "dismissed";
};
export type ReportStatusValue = (typeof REPORT_STATUS)[keyof typeof REPORT_STATUS];
export declare const REPORT_STATUS_VALUES: [ReportStatusValue, ...ReportStatusValue[]];
//# sourceMappingURL=reportStatus.d.ts.map