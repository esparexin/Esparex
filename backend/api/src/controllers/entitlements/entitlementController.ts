/**
 * ESPAREX — ENTITLEMENT CONTROLLER
 * Single Source of Truth for user-facing posting entitlement matrix endpoint.
 */
import { Request, Response } from 'express';
import { respond } from '../../utils/respond';
import { sendErrorResponse } from '../../utils/errorResponse';
import { EntitlementOrchestrator } from '@esparex/core/domains/entitlements';

interface AuthenticatedUser {
  _id?: { toString(): string };
  id?: string;
}

export const getPostingEntitlements = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as AuthenticatedUser | undefined;
    const userId = user?._id?.toString() || user?.id;
    if (!userId) {
      sendErrorResponse(req, res, 401, 'Unauthorized');
      return;
    }

    const matrix = await EntitlementOrchestrator.getUserPostingEntitlementMatrix(userId);
    res.json(respond({ success: true, data: matrix }));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch posting entitlement matrix';
    sendErrorResponse(req, res, 500, message);
  }
};
