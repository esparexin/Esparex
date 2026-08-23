import express from 'express';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import listingRoutes from './listingRoutes';
import * as getListingsController from "../controllers/listing/getListings.controller";
import { searchLimiter } from "../middleware/rateLimiter";
import { publicCacheControl } from "../middleware/publicCacheControl";
import logger from '@esparex/core/utils/logger';

const router = express.Router();

// 🛡️ MOBILE STALE BUNDLE COMPATIBILITY LAYER
router.use((req, res, next) => {
    logger.info(`[COMPATIBILITY_LAYER] Intercepted legacy request: ${req.method} ${req.originalUrl}`);
    next();
});

/**
 * Specific Stale Mappings
 */
// The stale bundle requests /listings/feed, which is now /listings/home
router.get("/listings/feed", publicCacheControl(300, 3600), searchLimiter, getListingsController.getHomeFeed);

// Standard Mappings
router.use('/listings', listingRoutes);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);

export default router;
