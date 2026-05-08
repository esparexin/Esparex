
import { Request, Response, NextFunction } from "express";
import { verifyToken, JwtPayload } from "@esparex/core/utils/auth";
import redis from "@esparex/core/config/redis";
import User from "@esparex/core/models/User";
import { isTokenBlacklisted } from "@esparex/core/utils/redisCache";
import { sendErrorResponse } from "@esparex/core/utils/errorResponse";
import logger from '@esparex/core/utils/logger';
import { getAuthCookieOptions, getLegacyHostOnlyAuthCookieOptions } from '@esparex/core/utils/cookieHelper';
import { setReliabilityContext } from '@esparex/core/utils/reliabilityContext';

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
    // Backward compatibility: previously cache stored only plain status string
  }
  return { status: cached };
};

const isStaticAsset = (path: string): boolean => {
  const cleanPath = path.split('?')[0];
  return (
    cleanPath === '/manifest.json' ||
    cleanPath === '/sw.js' ||
    cleanPath === '/favicon.ico' ||
    cleanPath === '/robots.txt' ||
    cleanPath.startsWith('/icons/')
  );
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
    if (isStaticAsset(req.path)) {
      return next();
    }

    // Avoid caching authenticated responses in browsers/proxies
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    // Skip if already verified
    const authUser = req.user;
    if (req.admin || authUser?.isAdmin) {
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
      _id: decoded.id,
      role: decoded.role,
      isAdmin: decoded.role === "admin" || decoded.role === "super_admin"
    };
    setReliabilityContext({ userId: decoded.id });

    // User Hydration (with Redis Caching)
    const cacheKey = `user:status:${decoded.id}`;
    const cachedUserStatus = parseCachedUserStatus(await redis.get(cacheKey));

    // Always validate tokenVersion using authoritative DB record.
    // Cached user data must never be trusted for tokenVersion checks.
    const user = await User.findById(decoded.id).select('status tokenVersion').lean();
    if (!user) {
      clearAuthCookie(res);
      sendErrorResponse(req, res, 401, "User not found");
      return;
    }

    const storedTokenVersion = (user as { tokenVersion?: number }).tokenVersion ?? 0;
    const decodedVersion = decoded.tokenVersion ?? 0;
    if (storedTokenVersion !== decodedVersion) {
      // Invalidate cached status when tokenVersion changes to prevent stale auth cache reads.
      await redis.del(cacheKey);
      clearAuthCookie(res);
      sendErrorResponse(req, res, 401, "Session expired. Please log in again.");
      return;
    }

    const userStatus = user.status as string | undefined;
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

    const isActive = userStatus === 'live';
    if (!isActive) {
      const statusStr = userStatus || 'unknown';
      sendErrorResponse(req, res, 403, "Account restricted", {
        message: `Your account is currently ${statusStr}. Please contact support.`,
        type: statusStr.toUpperCase(),
        code: `USER_${statusStr.toUpperCase()}`
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
  if (isStaticAsset(req.path)) {
    return next();
  }

  const tokenData = extractToken(req);

  if (!tokenData) return next();

  try {
    const { token } = tokenData;
    const decoded = verifyToken(token) as { id?: string; role?: string; jti?: string } | null;

    if (decoded?.id && decoded.role) {
      req.user = {
        _id: decoded.id,
        role: decoded.role,
        isAdmin: decoded.role === "admin" || decoded.role === "super_admin"
      };
      setReliabilityContext({ userId: decoded.id });
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
      const user = req.user;
      if (!user) {
        sendErrorResponse(req, res, 401, "Not authorized");
        return;
      }

      if (!roles.includes(user.role)) {
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
  const user = req.user;
  if (!user) {
    sendErrorResponse(req, res, 401, "Not authorized");
    return;
  }

  const isAdmin =
    user.isAdmin ||
    user.role === "admin" ||
    user.role === "super_admin";

  if (!isAdmin) {
    sendErrorResponse(req, res, 403, "Admin access required");
    return;
  }

  next();
};
