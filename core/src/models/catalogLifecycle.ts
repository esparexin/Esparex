import { CATALOG_APPROVAL_STATUS } from '../constants/enums/catalogApprovalStatus';
import { deriveApprovalStatus } from '../services/catalog/CatalogValidationService';

/**
 * Derives and applies the catalog approval status to a document before validation.
 */
export const applyCatalogLifecycleFields = (mutableDoc: any, fallback = CATALOG_APPROVAL_STATUS.APPROVED) => {
    const approvalStatus = deriveApprovalStatus({
        approvalStatus: mutableDoc.approvalStatus,
        isActive: mutableDoc.isActive,
        fallback,
    });
    mutableDoc.approvalStatus = approvalStatus;
};

/**
 * Standard JSON transform for catalog entities (id mapping, cleanup).
 */
export const catalogEntityToJsonTransform = (_doc: any, ret: any) => {
    const json = ret;
    json.id = String(json._id);
    delete json._id;
    return json;
};
