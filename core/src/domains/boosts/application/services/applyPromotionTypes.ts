import type { IBoost } from '../../../../models/Boost';

export type PromotionKind = 'push_to_top' | 'boost' | 'spotlight_hp' | 'spotlight_cat';

/** Rollback routing: which retired flow to execute when the flag is OFF. */
export type PromotionLegacySource = 'listing-controller' | 'ad-mutation';

export interface ApplyPromotionParams {
    userId: string;
    listingId: string;
    entityType?: 'ad' | 'service' | 'part';
    promotionType: PromotionKind;
    durationDays?: number;
    isAdmin?: boolean;
    legacySource?: PromotionLegacySource;
    /** Injectable for contract tests; defaults to the payments port adapter. */
    creditPort?: import('../ports/PromotionCreditPort').PromotionCreditPort;
}

export interface ApplyPromotionResult {
    boost: IBoost;
    effectiveDays: number;
}
