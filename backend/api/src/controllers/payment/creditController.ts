/**
 * ESPAREX — CREDIT CONTROLLER
 * Single Source of Truth for user-facing credit evaluation and wallet breakdown endpoints.
 */
import { Request, Response } from 'express';
import { respond } from '../../utils/respond';
import { sendErrorResponse } from '../../utils/errorResponse';
import { CreditRulesEngine } from '@esparex/core/domains/credits/application/CreditRulesEngine';
import { getAdPostingBalance } from '@esparex/core/domains/boosts/application/services/AdSlotService';

interface AuthenticatedUser {
  _id?: { toString(): string };
  isBusinessVerified?: boolean;
  userType?: string;
}

export const evaluateCredits = async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthenticatedUser | undefined;
    const userId = user?._id?.toString();
    if (!userId) return sendErrorResponse(req, res, 401, 'Unauthorized');

    const { categoryId, locationId, listingType } = req.body || {};
    const userRole = user?.isBusinessVerified || user?.userType === 'business' ? 'business' : 'normal';


    const evaluation = await CreditRulesEngine.evaluateUserEntitlement(userId, {
      categoryId,
      locationId,
      listingType,
      userRole,
    });

    res.json(respond({ success: true, data: evaluation }));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unexpected error during credit evaluation';
    sendErrorResponse(req, res, 500, message);
  }
};

export const getCreditWalletSummary = async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthenticatedUser | undefined;
    const userId = user?._id?.toString();
    if (!userId) return sendErrorResponse(req, res, 401, 'Unauthorized');

    const balance = await getAdPostingBalance(userId);

    const summary = {
      monthlyFree: {
        limit: balance.freeLimit,
        used: balance.freeUsed,
        remaining: balance.freeRemaining,
        resetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString(),
      },
      purchased: {
        balance: balance.paidCredits,
      },
      promotional: {
        balance: 0,
      },
      subscription: {
        unlimited: false,
      },
      totalRemaining: balance.totalRemaining,
    };

    res.json(respond({ success: true, data: summary }));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unexpected error fetching credit wallet summary';
    sendErrorResponse(req, res, 500, message);
  }
};

export const renewBusinessPlanController = async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthenticatedUser | undefined;
    const userId = user?._id?.toString();
    if (!userId) return sendErrorResponse(req, res, 401, 'Unauthorized');

    const { planId, durationDays = 365 } = req.body || {};
    if (!planId) return sendErrorResponse(req, res, 400, 'planId is required');

    const { renewBusinessPlan } = await import('@esparex/core/domains/payments/application/PlanService');
    const updatedPlan = await renewBusinessPlan(userId, planId, Number(durationDays));

    res.json(respond({ success: true, data: updatedPlan }));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to renew business plan';
    sendErrorResponse(req, res, 500, message);
  }
};

/**
 * GET CREDIT LEDGER HISTORY
 * Returns paginated credit audit trail (debits, credits, expirations, resets).
 */
export const getCreditLedgerHistory = async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthenticatedUser | undefined;
    const userId = user?._id?.toString();
    if (!userId) return sendErrorResponse(req, res, 401, 'Unauthorized');

    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string, 10) || 10));
    const skip = (page - 1) * limit;

    const { default: CreditTransaction } = await import('@esparex/core/models/CreditTransaction');
    const AdModel = (await import('@esparex/core/models/Ad')).default;
    const mongoose = (await import('mongoose')).default;

    const userObjId = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId;
    const idFilter = { $in: [userId, userObjId] };

    const [items, total] = await Promise.all([
      CreditTransaction.find({ userId: idFilter })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      CreditTransaction.countDocuments({ userId: idFilter }),
    ]);

    interface AdLeanSummary {
      _id: unknown;
      title?: string;
      slug?: string;
      seoSlug?: string;
      status?: string;
      expiresAt?: Date | string;
    }

    const listingIds = Array.from(
      new Set(
        items
          .map((tx) => tx.listingId?.toString())
          .filter((id): id is string => Boolean(id))
      )
    );

    const ads = listingIds.length > 0
      ? await AdModel.find({ _id: { $in: listingIds } }).select('_id title slug seoSlug status expiresAt').lean()
      : [];

    const adMap = new Map<string, AdLeanSummary>(
      ads.map((a) => [
        a._id.toString(),
        a as AdLeanSummary,
      ])
    );

    const now = Date.now();
    const formattedItems = items.map((tx) => {
      const listingIdStr = tx.listingId?.toString();
      const ad = listingIdStr ? adMap.get(listingIdStr) : undefined;
      const adTitle = (ad?.title as string | undefined) || undefined;
      const adSlug = ((ad?.seoSlug as string) || (ad?.slug as string) || listingIdStr) || undefined;

      let adStatus: string | undefined = undefined;
      let adExpiresAt: string | undefined = undefined;
      let adRemainingDays: number | undefined = undefined;

      if (ad) {
        const adExpMs = ad.expiresAt ? new Date(String(ad.expiresAt)).getTime() : 0;
        const isExpired = ad.status === 'expired' || (adExpMs > 0 && adExpMs <= now);
        adStatus = isExpired ? 'expired' : ((ad.status as string) || 'active');
        adExpiresAt = ad.expiresAt ? new Date(String(ad.expiresAt)).toISOString() : undefined;
        if (adExpMs > 0) {
          adRemainingDays = Math.max(0, Math.ceil((adExpMs - now) / (1000 * 60 * 60 * 24)));
        }
      }

      const reason = tx.reason || 'Credit Transaction';
      const reasonLower = reason.toLowerCase();
      const isSpotlight = reasonLower.includes('spotlight');
      const isPushToTop = reasonLower.includes('boost') || reasonLower.includes('top ad') || reasonLower.includes('push_to_top');
      const isAlert = reasonLower.includes('alert');

      let entitlementType = 'AD_POSTING';
      if (isSpotlight) entitlementType = 'SPOTLIGHT_HP';
      else if (isPushToTop) entitlementType = 'PUSH_TO_TOP';
      else if (isAlert) entitlementType = 'SMART_ALERT_SLOT';

      const metadata = tx.metadata as Record<string, unknown> | undefined;
      const effectiveDurationDays = typeof metadata?.effectiveDurationDays === 'number'
        ? metadata.effectiveDurationDays
        : (isSpotlight ? 1 : undefined);

      const validityText = effectiveDurationDays ? `${effectiveDurationDays} day${effectiveDurationDays > 1 ? 's' : ''}` : undefined;

      const txCreatedMs = tx.createdAt ? new Date(String(tx.createdAt)).getTime() : now;
      let spotlightExpiresAt: string | undefined = undefined;
      let spotlightStatus: 'ACTIVE' | 'EXPIRED' | undefined = undefined;

      if (isSpotlight) {
        const durationDaysCount = effectiveDurationDays || 1;
        const spotEndsMs = txCreatedMs + durationDaysCount * 24 * 60 * 60 * 1000;
        spotlightExpiresAt = new Date(spotEndsMs).toISOString();
        spotlightStatus = spotEndsMs <= now ? 'EXPIRED' : 'ACTIVE';
      }

      return {
        transactionId: tx._id.toString(),
        type: tx.type || 'DEBIT',
        creditPool: tx.creditPool || 'PURCHASED',
        amount: tx.amount || 1,
        entitlementType,
        reason,
        listingId: listingIdStr,
        adTitle,
        adSlug,
        adStatus,
        adExpiresAt,
        adRemainingDays,
        validityText,
        spotlightExpiresAt,
        spotlightStatus,
        createdAt: new Date(txCreatedMs).toISOString(),
      };
    });

    res.json(
      respond({
        success: true,
        data: {
          items: formattedItems,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      })
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch credit ledger history';
    sendErrorResponse(req, res, 500, message);
  }
};

