/**
 * Rollback-only legacy branch for the unified `applyPromotion` (P0-1).
 * Executes the retired per-caller legacy flow when `ENABLE_UNIFIED_APPLY_PROMOTION`
 * is OFF. Delete with the flag in Phase 4 (DECISION-GATE §4).
 */
import { Types } from 'mongoose';
import { AppError } from '../../../../shared-kernel/errors/AppError';
import type { IBoost } from '../../../../models/Boost';
import type { PromotionKind, PromotionLegacySource } from './applyPromotionTypes';

export async function applyPromotionLegacy(params: {
    userId: string;
    listingId: string;
    entityType: 'ad' | 'service' | 'part';
    promotionType: PromotionKind;
    durationDays: number;
    isAdmin: boolean;
    legacySource: PromotionLegacySource;
}): Promise<{ boost: IBoost; effectiveDays: number }> {
    const { userId, listingId, entityType, promotionType, durationDays, isAdmin, legacySource } = params;

    if (legacySource === 'ad-mutation') {
        const { promoteAdLogic } = await import('../../../listings/application/ad/AdPromotionService');
        await promoteAdLogic({
            id: listingId,
            userId,
            days: durationDays,
            type: promotionType === 'spotlight_cat' ? 'spotlight_cat' : 'spotlight_hp',
            isAdmin,
        });
    } else {
        const { PromotionService } = await import('../../../payments/application/PromotionService');
        if (promotionType === 'push_to_top' || promotionType === 'boost') {
            await PromotionService.applyBoost({ userId, listingId, entityType, durationDays });
        } else {
            await PromotionService.applySpotlight({
                userId,
                listingId,
                entityType,
                spotlightType: promotionType === 'spotlight_cat' ? 'spotlight_cat' : 'spotlight_hp',
                durationDays,
            });
        }
    }

    const BoostModel = (await import('../../../../models/Boost')).default;
    const boost = await BoostModel.findOne({
        entityId: new Types.ObjectId(listingId),
        isActive: true,
    }).sort({ endsAt: -1 });
    if (!boost) {
        throw new AppError('Legacy promotion flow did not produce a boost record', 500, 'LEGACY_PROMOTION_FAILED');
    }
    return { boost: boost as IBoost, effectiveDays: durationDays };
}
