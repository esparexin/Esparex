import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { sendSuccessResponse } from '../../utils/respond';
import { sendErrorResponse } from '../../utils/errorResponse';
import { resolveBalances } from '@esparex/core/domains/entitlements/application/EntitlementBalanceService';
import { getStorageSafeId } from './shared';
import type { AuthUser } from '../../types/auth.types';
import type { UserBenefitsResponseDTO } from '@esparex/contracts';

/**
 * Single entry point Benefit Resolver API (/api/v1/user/benefits/resolve).
 * Per ADR-003 & BR-006:
 * Aggregates Entitlements + UserPlan + Wallet Snapshot into single client payload.
 */
export const resolveUserBenefits = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        if (!req.user) {
            sendErrorResponse(req, res, 401, 'Unauthorized');
            return;
        }

        const authUser = req.user as AuthUser;
        const userId = getStorageSafeId(authUser);

        if (!userId || !Types.ObjectId.isValid(userId)) {
            sendErrorResponse(req, res, 401, 'Invalid session');
            return;
        }

        // Resolve entitlement balances & subscription metadata via SSOT domain service
        const balances = await resolveBalances(userId);

        const freeSlotsUsed = balances.monthlyFreeAdsUsed || 0;
        const freeSlotsTotal = 5;
        const freeSlotsRemaining = Math.max(0, freeSlotsTotal - freeSlotsUsed);

        const responsePayload: UserBenefitsResponseDTO = {
            userTier: balances.activePlanName ? balances.activePlanName : 'FREE_SELLER',
            capabilities: {
                canPostAd: freeSlotsRemaining > 0 || balances.adCredits > 0,
                canCreateSmartAlert: true,
                canAccessBusinessPage: balances.hasActivePlan,
                analyticsTier: balances.hasActivePlan ? 'ADVANCED' : 'BASIC',
            },
            balances: {
                freeMonthlySlots: {
                    total: freeSlotsTotal,
                    used: freeSlotsUsed,
                    remaining: freeSlotsRemaining,
                    resetsAt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString(),
                },
                purchasedAdCredits: {
                    remaining: balances.adCredits,
                    expires: null,
                },
                spotlightCredits: {
                    remaining: balances.spotlightCredits,
                    expires: null,
                },
                topAdCredits: {
                    remaining: balances.topAdCredits,
                    expires: null,
                },
                smartAlertSlots: {
                    used: 0,
                    totalCap: balances.smartAlertSlots || 2,
                },
            },
        };

        sendSuccessResponse(res, responsePayload);
        return;
    } catch (err) {
        next(err);
    }
};
