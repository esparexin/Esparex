/**
 * ESPAREX — CREDIT CONTROLLER
 * Single Source of Truth for user-facing credit evaluation and wallet breakdown endpoints.
 */
import { Request, Response } from 'express';
import { respond } from '../../utils/respond';
import { sendErrorResponse } from '../../utils/errorResponse';
import { CreditRulesEngine } from '@esparex/core/domains/credits/application/CreditRulesEngine';
import { getAdPostingBalance } from '@esparex/core/domains/boosts/application/services/AdSlotService';

export const evaluateCredits = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id?.toString();
    if (!userId) return sendErrorResponse(req, res, 401, 'Unauthorized');

    const { categoryId, locationId, listingType } = req.body || {};
    const userObj = req.user as unknown as { isBusinessVerified?: boolean; userType?: string } | undefined;
    const userRole = userObj?.isBusinessVerified || userObj?.userType === 'business' ? 'business' : 'normal';


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
    const userId = req.user?._id?.toString();
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
    const userId = req.user?._id?.toString();
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

