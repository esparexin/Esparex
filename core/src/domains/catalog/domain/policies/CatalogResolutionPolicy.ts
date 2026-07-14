import { CatalogValidationServiceShared } from '@esparex/shared';

export enum CatalogResolutionDecision {
    AUTO_APPROVE = 'AUTO_APPROVE',
    MANUAL_REVIEW = 'MANUAL_REVIEW',
    REJECT = 'REJECT'
}

export interface CatalogResolutionContext {
    requestType: 'brand' | 'model';
    categoryId: string;
    requestedName: string;
    userId: string;
}

export class CatalogResolutionPolicy {
    public static evaluate(ctx: CatalogResolutionContext): CatalogResolutionDecision {
        // 1. Run through the validation pipeline in CatalogValidationService
        const validation = CatalogValidationServiceShared.validateCatalogInput({
            name: ctx.requestedName,
            requestType: ctx.requestType
        });

        if (!validation.ok) {
            return CatalogResolutionDecision.REJECT;
        }

        // 2. Resolve policy decisions (extensible to check user trust limits)
        if (ctx.requestType === 'brand') {
            return CatalogResolutionDecision.AUTO_APPROVE;
        } else {
            return CatalogResolutionDecision.AUTO_APPROVE;
        }
    }
}
