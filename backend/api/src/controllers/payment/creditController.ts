/**
 * ESPAREX — CREDIT CONTROLLER
 * Single Source of Truth for user-facing credit evaluation and wallet breakdown endpoints.
 */
import { Request, Response } from 'express';
import type { CreditWalletSummaryPayload } from '@esparex/contracts';
import { respond } from '../../utils/respond';
import { sendErrorResponse } from '../../utils/errorResponse';
import { CreditRulesEngine } from '@esparex/core/domains/credits/application/CreditRulesEngine';
import { getAdPostingBalance } from '@esparex/core/domains/boosts/application/services/AdSlotService';
import { DashboardFacade } from '@esparex/core/domains/payments/application/DashboardFacade';

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

    const [balance, snapshot] = await Promise.all([
      getAdPostingBalance(userId),
      DashboardFacade.getDashboardSnapshot(userId).catch(() => null),
    ]);

    const summary: CreditWalletSummaryPayload = {
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
        activePlan: snapshot?.subscription?.planName,
      },
      totalRemaining: balance.totalRemaining,
      adCredits: balance.totalRemaining,
      spotlightCredits: snapshot?.wallet?.spotlightCredits ?? 0,
      smartAlertSlots: snapshot?.wallet?.smartAlertSlots ?? 2,
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

    const { getCreditLedgerHistoryByUserId } = await import(
      '@esparex/core/domains/payments/application/WalletQueryService'
    );

    const { items, total } = await getCreditLedgerHistoryByUserId(userId, { limit, skip });

    res.json(
      respond({
        success: true,
        data: {
          items,
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

