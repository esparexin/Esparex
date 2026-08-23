import express from 'express';
import { setCsrfToken, getCsrfToken } from '../middleware/csrfProtection';
import { healthCheckHandler } from '../utils/health';
import listingRoutes from './listingRoutes';

const router = express.Router();

router.get('/health', healthCheckHandler);
router.get('/csrf-token', setCsrfToken, getCsrfToken);

// 🛡️ MOBILE STALE BUNDLE COMPATIBILITY LAYER
// The mobile app is currently requesting /listings (without /v1) due to a bundling lag.
// We mount listingRoutes here as well to prevent 404s until the bundle updates.
router.use('/listings', listingRoutes);

export default router;
