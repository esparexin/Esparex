import express from 'express';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import listingRoutes from './listingRoutes';
import * as getListingsController from "../controllers/listing/getListings.controller";
import { searchLimiter } from "../middleware/rateLimiter";
import { publicCacheControl } from "../middleware/publicCacheControl";
import logger from '@esparex/core/utils/logger';

const router = express.Router();

// Fallback routing layer for un-prefixed requests
router.use((req, res, next) => {
    logger.info(`[FALLBACK_ROUTER] Intercepted un-prefixed request: ${req.method} ${req.originalUrl}`);
    next();
});

/**
 * Specific Mappings
 */
// Un-prefixed feed requests mapped to home feed
router.get("/listings/feed", publicCacheControl(300, 3600), searchLimiter, getListingsController.getHomeFeed);

// Standard Mappings
router.use('/listings', listingRoutes);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);

export default router;
