export declare const CATALOG_APPROVAL_STATUS: {
    readonly PENDING: "pending";
    readonly APPROVED: "approved";
    readonly REJECTED: "rejected";
};
export type CatalogApprovalStatusValue = (typeof CATALOG_APPROVAL_STATUS)[keyof typeof CATALOG_APPROVAL_STATUS];
export declare const CATALOG_APPROVAL_STATUS_VALUES: [CatalogApprovalStatusValue, ...CatalogApprovalStatusValue[]];
