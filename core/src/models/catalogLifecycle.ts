import { CATALOG_APPROVAL_STATUS } from '../constants/enums/catalogApprovalStatus';
import { deriveApprovalStatus } from '../services/catalog/CatalogValidationService';

/**
 * Derives and applies the catalog approval status to a document before validation.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Mongoose pre-validate doc boundary; index signature not available
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Mongoose toJSON transform; _doc and ret types are not indexable
export const catalogEntityToJsonTransform = (_doc: any, ret: any) => {
    const json = ret;
    json.id = String(json._id);
    delete json._id;
    return json;
};
