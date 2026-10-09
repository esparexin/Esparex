import express from 'express';
import * as monetizationController from '../controllers/monetizationController';
import { protect } from '../middleware/authMiddleware';
import { mutationLimiter } from '../middleware/rateLimiter';

const router = express.Router();

// Public ad resolution (no billing writes — kept public)
router.post('/resolve', monetizationController.resolveAd);

// Campaign telemetry — billing-adjacent counters, require auth + rate limiting (P0-2)
router.post('/:id/impression', protect, mutationLimiter, monetizationController.recordImpression);
router.post('/:id/click', protect, mutationLimiter, monetizationController.recordClick);

export default router;
