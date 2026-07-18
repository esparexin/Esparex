export const CATALOG_APPROVAL_STATUS = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
} as const;

export type CatalogApprovalStatusValue =
    (typeof CATALOG_APPROVAL_STATUS)[keyof typeof CATALOG_APPROVAL_STATUS];

export const CATALOG_APPROVAL_STATUS_VALUES = Object.values(
    CATALOG_APPROVAL_STATUS
) as [CatalogApprovalStatusValue, ...CatalogApprovalStatusValue[]];

