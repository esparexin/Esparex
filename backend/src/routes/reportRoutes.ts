import express from 'express';
import * as reportController from '../controllers/report';
import { protect } from '../middleware/authMiddleware';
import { reportLimiter } from '../middleware/rateLimiter';
import { validateRequest } from '../middleware/validateRequest';
import { createReportSchema } from '../validators/report.validator';

const router = express.Router();

/**
 * POST /api/v1/reports
 * Submit an ad report
 */
router.post(
    '/',
    protect,
    reportLimiter,
    validateRequest(createReportSchema),
    reportController.createReport
);

export default router;

