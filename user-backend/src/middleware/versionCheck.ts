import { Request, Response, NextFunction } from 'express';
import logger from '@core/utils/logger';
import { buildErrorResponse } from "@core/utils/errorResponse";

// Minimum supported version for the platform
const MIN_SUPPORTED_VERSION = '1.0.0';

/**
 * Validates the x-app-version header sent by the client.
 * Rejects requests if the version is below the minimum supported threshold.
 */
export const versionCheckMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const appVersion = req.headers['x-app-version'];
  
  if (!appVersion) {
    // In production, we might want to enforce this. 
    // For now, we'll log it and allow if it's missing (to avoid breaking web users who might have cached old JS).
    // However, for mobile, it should always be present.
    logger.debug(`[Version Check] Missing x-app-version header for ${req.method} ${req.path}`);
    return next();
  }

  if (typeof appVersion !== 'string') {
    return res.status(400).json(buildErrorResponse(req, 400, 'Invalid app version format'));
  }

  // Basic semver comparison (v1.x.x vs v1.x.x)
  try {
    const minParts = MIN_SUPPORTED_VERSION.split('.').map(Number);
    const appParts = appVersion.replace(/^v/, '').split('.').map(Number);

    for (let i = 0; i < 3; i++) {
      const min = minParts[i] || 0;
      const app = appParts[i] || 0;
      if (app > min) break;
      if (app < min) {
        logger.warn(`[Version Check] Rejected outdated client: ${appVersion} (Min: ${MIN_SUPPORTED_VERSION})`);
        return res.status(426).json(buildErrorResponse(req, 426, 'Update required', {
          details: {
            currentVersion: appVersion,
            minimumVersion: MIN_SUPPORTED_VERSION,
            updateUrl: 'https://esparex.in/update'
          }
        }));
      }
    }
  } catch (error) {
    logger.error('[Version Check] Error parsing version:', error);
  }

  next();
};
