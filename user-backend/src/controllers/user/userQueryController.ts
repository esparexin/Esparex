import { Request, Response, NextFunction } from 'express';
import { respond } from "@core/utils/respond";
import { ApiResponse } from "@shared/types/Api";
import { User as SharedUser } from "@shared/types/User";
import { serializeDoc } from '@core/utils/serialize';
import { sendErrorResponse } from "@core/utils/errorResponse";
import { getBusinessStatus, getStorageSafeId, sanitizeUser, toSharedUser } from './shared';
import { getUserProfileById as getPublicUserProfileById, type SellerProfilePayload } from '@core/services/UserProfileService';
import { getUserWithBusiness } from '@core/services/UserService';
import type { AuthUser } from '../../types/auth.types';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const resolveUserId = (req: Request, res: Response): string | null => {
  const userId = typeof req.params.id === 'string' ? req.params.id : '';
  if (!userId) {
    sendErrorResponse(req, res, 400, 'Invalid user id');
    return null;
  }
  return userId;
};

export const getMe = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendErrorResponse(req, res, 401, 'Unauthorized');
      return;
    }

    const authUser: AuthUser | undefined = req.user;
    const userId = getStorageSafeId(authUser);

    if (!userId) {
      sendErrorResponse(req, res, 401, 'Invalid session');
      return;
    }

    const { user, business } = await getUserWithBusiness(userId);

    if (!user) {
      sendErrorResponse(req, res, 404, 'User not found');
      return;
    }

    const safeUser = sanitizeUser(user);
    const serializedBusiness = business ? serializeDoc<unknown>(business) : null;
    const safeBusiness = isRecord(serializedBusiness) ? serializedBusiness : null;

    const businessStatus = getBusinessStatus(
      business?.status
    );

    const responseData = toSharedUser(
      safeUser,
      businessStatus,
      typeof safeBusiness?.id === 'string' ? safeBusiness.id : undefined
    );

    const response = respond<ApiResponse<SharedUser>>({
      success: true,
      data: responseData,
    });

    res.json(response);
  } catch (err) {
    next(err);
  }
};

export const getUserProfileById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = resolveUserId(req, res);
    if (!userId) return;

    const profile = await getPublicUserProfileById(userId);
    if (!profile) {
      sendErrorResponse(req, res, 404, 'Seller not found');
      return;
    }

    res.json(respond<ApiResponse<SellerProfilePayload>>({
      success: true,
      data: profile
    }));
  } catch (error) {
    next(error);
  }
};
