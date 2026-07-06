/**
 * ESPAREX â€” SMART ALERT HELPERS (backend/user transport layer)
 *
 * Contains the Express-aware getRequiredAlertId(req) function.
 * The pure functions remain in @utils/smartAlertHelpers.
 */
export * from '@esparex/core/utils';;

import { Request } from 'express';
import { AppError } from '@esparex/core/utils';;;;

export const getRequiredAlertId = (req: Request): string => {
    const id = req.params.id;
    if (typeof id !== 'string' || !id.trim()) {
        throw new AppError('Invalid alert ID', 400, 'INVALID_ALERT_ID');
    }
    return id;
};

