import { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import { verifyToken, JwtPayload } from "@core/utils/auth";
import redis from "@core/config/redis";
import User from "@core/models/User";
import { isTokenBlacklisted } from "@core/utils/redisCache";
import { sendErrorResponse } from "@core/utils/errorResponse";
import logger from '@core/utils/logger';
import { Role } from "@core/constants/enums/roles";
import { getAuthCookieOptions, getLegacyHostOnlyAuthCookieOptions } from '@core/utils/cookieHelper';

/**
 * ESPAREX — CANONICAL END-USER AUTH MIDDLEWARE (SSOT)
 * 
 * Used by:
 * - backend/user (Public App)
 * - backend/admin (Admin masked/masquerade actions)
 */

const extractToken = (req: Request): { token: string } | null => {
  // 1️⃣ Authorization Header
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return { token: authHeader.split(" ")[1] ?? "" };
  }

  // 2️⃣ User Cookie Fallback
  if (req.cookies?.esparex_auth) {
    return { token: req.cookies.esparex_auth as string };
  }

  return null;
};

const clearAuthCookie = (res: Response) => {
  res.clearCookie("esparex_auth", getLegacyHostOnlyAuthCookieOptions(0));
  res.clearCookie("esparex_auth", getAuthCookieOptions(0));
};

type CachedUserStatus = {
  status: string;
  tokenVersion?: number;
};

const parseCachedUserStatus = (cached: string | null): CachedUserStatus | null => {
  if (!cached) return null;
  try {
    const parsed = JSON.parse(cached) as Partial<CachedUserStatus>;
    if (parsed && typeof parsed.status === "string") {
      return {
        status: parsed.status,
        tokenVersion: typeof parsed.tokenVersion === "number" ? parsed.tokenVersion : undefined,
      };
    }
  } catch {
    // Backward compatibility
  }
  return { status: cached };
};

/**
 * Protect route - requires valid end-user token
 */
export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    // Skip if already verified (e.g. by requireAdmin)
    if (req.admin || req.user?.isAdmin) {
      return next();
    }

    const tokenData = extractToken(req);

    if (!tokenData) {
      sendErrorResponse(req, res, 401, "Not authorized, no token");
      return;
    }

    const { token } = tokenData;
    const decoded = verifyToken(token) as JwtPayload | null;

    if (!decoded?.id || !decoded.role) {
      clearAuthCookie(res);
      sendErrorResponse(req, res, 401, "Invalid token");
      return;
    }

    const isBlacklisted = await isTokenBlacklisted(decoded.jti || token);
    if (isBlacklisted) {
      clearAuthCookie(res);
      sendErrorResponse(req, res, 401, "Session expired or invalid");
      return;
    }

    // Canonical req.user Setup
    req.user = {
      _id: new Types.ObjectId(decoded.id),
      id: decoded.id,
      role: decoded.role,
      isAdmin: (decoded.role as Role) === Role.ADMIN || (decoded.role as Role) === Role.SUPER_ADMIN
    };

    const cacheKey = `user:status:${req.user.id}`;
    const cachedUserStatus = parseCachedUserStatus(await redis.get(cacheKey));

    const user = await User.findById(req.user._id).select('status tokenVersion').lean();
    if (!user) {
      clearAuthCookie(res);
      sendErrorResponse(req, res, 401, "User not found");
      return;
    }

    const storedTokenVersion = (user as { tokenVersion?: number }).tokenVersion ?? 0;
    const decodedVersion = decoded.tokenVersion ?? 0;
    if (storedTokenVersion !== decodedVersion) {
      await redis.del(cacheKey);
      clearAuthCookie(res);
      sendErrorResponse(req, res, 401, "Session expired. Please log in again.");
      return;
    }

    const userStatus = user.status;
    if (
      !cachedUserStatus ||
      cachedUserStatus.status !== userStatus ||
      (cachedUserStatus.tokenVersion ?? -1) !== storedTokenVersion
    ) {
      await redis.set(
        cacheKey,
        JSON.stringify({ status: userStatus, tokenVersion: storedTokenVersion }),
        'EX',
        60
      );
    }

    if (userStatus !== 'live') {
      sendErrorResponse(req, res, 403, "Account restricted", {
        message: `Your account is currently ${userStatus}. Please contact support.`,
        type: userStatus.toUpperCase(),
        code: `USER_${userStatus.toUpperCase()}`
      });
      return;
    }

    next();
  } catch (err) {
    logger.error("[Auth] Protect error:", err);
    clearAuthCookie(res);
    sendErrorResponse(req, res, 401, "Token verification failed");
  }
};

/**
 * Optional Auth - populates req.user if token exists
 */
export const extractUser = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const tokenData = extractToken(req);
  if (!tokenData) return next();

  try {
    const { token } = tokenData;
    const decoded = verifyToken(token) as { id?: string; role?: string; jti?: string } | null;

    if (decoded?.id && decoded.role) {
      req.user = {
        _id: new Types.ObjectId(decoded.id),
        id: decoded.id,
        role: decoded.role,
        isAdmin: (decoded.role as Role) === Role.ADMIN || (decoded.role as Role) === Role.SUPER_ADMIN
      };
    }
  } catch {
    // Ignore invalid tokens for optional auth
  }

  next();
};

/**
 * Role Restriction
 */
export const restrictTo = (...roles: string[]) => (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    sendErrorResponse(req, res, 401, "Not authorized");
    return;
  }

  if (!roles.includes(req.user.role)) {
    sendErrorResponse(req, res, 403, "You do not have permission to perform this action");
    return;
  }

  next();
};

/**
 * Admin-only Check
 */
export const adminOnly = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    sendErrorResponse(req, res, 401, "Not authorized");
    return;
  }

  if (!req.user.isAdmin) {
    sendErrorResponse(req, res, 403, "Admin access required");
    return;
  }

  next();
};
