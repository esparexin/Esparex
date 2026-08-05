import { ClientSession, Types } from 'mongoose';
import Entitlement, { IEntitlement } from '../../../models/Entitlement';
import Ad from '../../../models/Ad';
import Boost from '../../../models/Boost';
import { LISTING_STATUS } from '@esparex/contracts';
import type { MonetizationErrorCode } from '@esparex/contracts';

export interface PromotionValidationResult {
    allowed: boolean;
    errorCode?: MonetizationErrorCode;
    reason?: string;
}

export class MonetizationRulesEngine {
    /**
     * Resolves exact entitlement to consume when posting an ad (BR-001).
     * Priority Order:
     * 1. Active FREE_ALLOWANCE entitlements expiring soonest
     * 2. Non-expiring PURCHASED_PACK ad credits
     * 3. SUBSCRIPTION_TIER allowances
     */
    static async resolvePostingDeduction(
        userId: string | Types.ObjectId,
        session?: ClientSession
    ): Promise<IEntitlement | null> {
        const query = Entitlement.find({
            userId: new Types.ObjectId(userId),
            type: 'AD_POSTING',
            status: 'ACTIVE',
            remaining: { $gt: 0 },
        });

        if (session) {
            query.session(session);
        }

        const entitlements = await query.exec();
        if (!entitlements || entitlements.length === 0) {
            return null;
        }

        // Sort by priority: FREE_ALLOWANCE first, then PURCHASED_PACK
        entitlements.sort((a, b) => {
            if (a.sourceType === 'FREE_ALLOWANCE' && b.sourceType !== 'FREE_ALLOWANCE') return -1;
            if (a.sourceType !== 'FREE_ALLOWANCE' && b.sourceType === 'FREE_ALLOWANCE') return 1;
            
            // If both expire, sort by soonest expiration
            if (a.expiresAt && b.expiresAt) {
                return a.expiresAt.getTime() - b.expiresAt.getTime();
            }
            if (a.expiresAt && !b.expiresAt) return -1;
            if (!a.expiresAt && b.expiresAt) return 1;

            return 0;
        });

        return entitlements[0];
    }

    /**
     * Validates whether a promotion can be applied to an ad (BR-005).
     */
    static async canApplyPromotion(
        listingId: string | Types.ObjectId,
        promoType: 'spotlight_hp' | 'spotlight_cat' | 'push_to_top',
        session?: ClientSession
    ): Promise<PromotionValidationResult> {
        const adQuery = Ad.findById(listingId);
        if (session) adQuery.session(session);

        const ad = await adQuery.exec();
        if (!ad) {
            return {
                allowed: false,
                errorCode: 'MON-007',
                reason: 'Listing not found',
            };
        }

        if (ad.status !== LISTING_STATUS.LIVE && ad.status !== LISTING_STATUS.ACTIVE) {
            return {
                allowed: false,
                errorCode: 'MON-007',
                reason: 'Listing must be in LIVE status to apply promotions',
            };
        }

        // Check if same boost is already active in Boost model
        const boostQuery = Boost.findOne({
            entityId: new Types.ObjectId(listingId),
            boostType: promoType,
            isActive: true,
            endsAt: { $gt: new Date() },
        });

        if (session) boostQuery.session(session);
        const existingBoost = await boostQuery.exec();

        if (existingBoost) {
            return {
                allowed: false,
                errorCode: 'MON-003',
                reason: 'This promotion is already active on this listing (BR-005)',
            };
        }

        return { allowed: true };
    }
}

export default MonetizationRulesEngine;
