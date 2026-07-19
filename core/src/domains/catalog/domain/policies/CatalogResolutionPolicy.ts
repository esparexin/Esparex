import { CatalogFacade } from '@esparex/shared';

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
        // 1. Validate name via CatalogFacade (single source of truth)
        const validation = ctx.requestType === 'brand'
            ? CatalogFacade.brand.validate.validateBrandName(ctx.requestedName)
            : CatalogFacade.model.validate.validateModelName(ctx.requestedName);

        if (!validation.ok) {
            return CatalogResolutionDecision.REJECT;
        }

        // 2. Resolve policy decisions (extensible to check user trust limits)
        return CatalogResolutionDecision.AUTO_APPROVE;
    }
}
