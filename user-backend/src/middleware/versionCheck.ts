import { Request, Response, NextFunction } from 'express';
import { getSystemConfigDoc } from '@core/utils/systemConfigHelper';
import logger from '@core/utils/logger';
import { buildErrorResponse } from "@core/utils/errorResponse";

// Fallback minimum supported version if DB fetch fails
const DEFAULT_MIN_VERSION = '1.0.0';

/**
 * Validates the x-app-version header sent by the client.
 * Rejects requests if the version is below the minimum supported threshold defined in SystemConfig.
 */
export const versionCheckMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const appVersion = req.headers['x-app-version'];
  
  if (!appVersion) {
    // Log missing version but allow for now to support web legacy
    logger.debug(`[Version Check] Missing x-app-version header for ${req.method} ${req.path}`);
    return next();
  }

  if (typeof appVersion !== 'string') {
    return res.status(400).json(buildErrorResponse(req, 400, 'Invalid app version format'));
  }

  try {
    const config = await getSystemConfigDoc();
    const minSupportedVersion = config?.platform?.minVersion || DEFAULT_MIN_VERSION;

    const minParts = minSupportedVersion.split('.').map(Number);
    const appParts = appVersion.replace(/^v/, '').split('.').map(Number);

    for (let i = 0; i < 3; i++) {
      const min = minParts[i] || 0;
      const app = appParts[i] || 0;
      if (app > min) break;
      if (app < min) {
        logger.warn(`[Version Check] Rejected outdated client: ${appVersion} (Min: ${minSupportedVersion})`);
        return res.status(426).json(buildErrorResponse(req, 426, 'Update required', {
          details: {
            currentVersion: appVersion,
            minimumVersion: minSupportedVersion,
            updateUrl: 'https://esparex.in/update'
          }
        }));
      }
    }
  } catch (error) {
    logger.error('[Version Check] Error:', error);
  }

  next();
};
