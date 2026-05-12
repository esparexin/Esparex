export const TAXONOMY_APPROVAL_STATUS = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
} as const;

export type TaxonomyApprovalStatusValue =
    (typeof TAXONOMY_APPROVAL_STATUS)[keyof typeof TAXONOMY_APPROVAL_STATUS];

export const TAXONOMY_APPROVAL_STATUS_VALUES = Object.values(
    TAXONOMY_APPROVAL_STATUS
) as [TaxonomyApprovalStatusValue, ...TaxonomyApprovalStatusValue[]];

