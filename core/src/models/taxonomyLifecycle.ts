import {
    TAXONOMY_APPROVAL_STATUS,
    type TaxonomyApprovalStatusValue,
} from '../constants/enums/taxonomyApprovalStatus';
import { deriveApprovalStatus } from '../services/catalog/taxonomySsot';

export const applyTaxonomyLifecycleFields = (
    mutableDoc: Record<string, unknown>,
    fallback: TaxonomyApprovalStatusValue = TAXONOMY_APPROVAL_STATUS.APPROVED
) => {
    const approvalStatus = deriveApprovalStatus({
        approvalStatus: mutableDoc.approvalStatus,
        isActive: mutableDoc.isActive,
        fallback,
    });

    mutableDoc.approvalStatus = approvalStatus;
};

export const taxonomyEntityToJsonTransform = (_doc: unknown, ret: unknown) => {
    const json = ret as Record<string, unknown>;
    json.id = String(json._id);
    delete json._id;
    return json;
};
