import type { Types } from 'mongoose';
import type { ICatalogRequest, CATALOG_REQUEST_STATUS_VALUES } from '../../models/CatalogRequest';

export type CatalogRequestStatusValue = (typeof CATALOG_REQUEST_STATUS_VALUES)[number];

export interface CatalogRequestApprovalResult {
    request: ICatalogRequest;
    resolvedEntityId: Types.ObjectId;
    createdCanonicalEntity: boolean;
}

export interface CatalogRequestRejectionResult {
    request: ICatalogRequest;
}
