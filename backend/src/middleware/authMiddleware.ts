import { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import { verifyToken, JwtPayload } from "../utils/auth";
import User from "../models/User";
import { isTokenBlacklisted } from "../utils/redisCache";
import { sendErrorResponse } from "../utils/errorResponse";
import logger from '../utils/logger';
import { Role } from "@shared/enums/roles";
import { getAuthCookieOptions, getLegacyHostOnlyAuthCookieOptions } from '../utils/cookieHelper';

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const extractToken = (req: Request): { token: string } | null => {
  // 2️⃣ Authorization Header
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return { token: authHeader.split(" ")[1] ?? "" };
  }

  // 3️⃣ User Cookie Fallback
  if (req.cookies?.esparex_auth) {
    return { token: req.cookies.esparex_auth };
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
    // Backward compatibility: previously cache stored only plain status string
  }
  return { status: cached };
};

/* -------------------------------------------------------------------------- */
/* Protect Middleware                                                         */
/* -------------------------------------------------------------------------- */

export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Avoid caching authenticated responses in browsers/proxies
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    // Skip if already verified
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

    // Check Blacklist via secure jti claim
    const isBlacklisted = await isTokenBlacklisted(decoded.jti || token);
    if (isBlacklisted) {
      clearAuthCookie(res);
      sendErrorResponse(req, res, 401, "Session expired or invalid");
      return;
    }

    // Common req.user Setup
    req.user = {
      _id: new Types.ObjectId(decoded.id),
      id: decoded.id,
      role: decoded.role as Role,
      isAdmin: decoded.role === Role.ADMIN || decoded.role === Role.SUPER_ADMIN
    };

    // User Hydration (with Redis Caching)
    const redisClient = (await import('../config/redis')).default;
    const cacheKey = `user:status:${req.user.id}`;
    const cachedUserStatus = parseCachedUserStatus(await redisClient.get(cacheKey));

    // Always validate tokenVersion using authoritative DB record.
    // Cached user data must never be trusted for tokenVersion checks.
    const user = await User.findById(req.user._id).select('status tokenVersion').lean();
    if (!user) {
      clearAuthCookie(res);
      sendErrorResponse(req, res, 401, "User not found");
      return;
    }

    const storedTokenVersion = (user as { tokenVersion?: number }).tokenVersion ?? 0;
    const decodedVersion = decoded.tokenVersion ?? 0;
    if (storedTokenVersion !== decodedVersion) {
      // Invalidate cached status when tokenVersion changes to prevent stale auth cache reads.
      await redisClient.del(cacheKey);
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
      await redisClient.set(
        cacheKey,
        JSON.stringify({ status: userStatus, tokenVersion: storedTokenVersion }),
        'EX',
        60
      );
    }

    const isActive = userStatus === 'active' || userStatus === 'live';
    if (!isActive) {
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

/* -------------------------------------------------------------------------- */
/* Optional Auth (Guest Allowed)                                               */
/* -------------------------------------------------------------------------- */

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
        role: decoded.role as Role,
        isAdmin: decoded.role === Role.ADMIN || decoded.role === Role.SUPER_ADMIN
      };
    }
  } catch {
    // Invalid token → ignore
  }

  next();
};

/* -------------------------------------------------------------------------- */
/* Role Restriction                                                           */
/* -------------------------------------------------------------------------- */

export const restrictTo =
  (...roles: string[]) =>
    (
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

/* -------------------------------------------------------------------------- */
/* Admin-only Middleware                                                      */
/* -------------------------------------------------------------------------- */

export const adminOnly = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    sendErrorResponse(req, res, 401, "Not authorized");
    return;
  }

  const isAdmin =
    req.user.isAdmin ||
    req.user.role === "admin" ||
    req.user.role === "super_admin";

  if (!isAdmin) {
    sendErrorResponse(req, res, 403, "Admin access required");
    return;
  }

  next();
};
