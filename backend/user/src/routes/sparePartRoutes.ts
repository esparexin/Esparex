import { Router, Request, Response, NextFunction } from 'express';
import { protect, extractUser } from '../middleware/authMiddleware';
import { requireBusinessApproved } from '../middleware/businessMiddleware';
import { validateObjectId } from '../middleware/validateObjectId';
import * as createListingController from '../controllers/listing/createListing.controller';
import * as getListingsController from '../controllers/listing/getListings.controller';
import * as engagementController from '../controllers/listing/engagement.controller';
import * as editListingController from '../controllers/listing/editListing.controller';
import { duplicateCooldownMiddleware } from '../middleware/duplicateCooldownMiddleware';
import { createListingValidator } from '../middleware/listing.validator';
import { phoneRevealLimiter, mutationLimiter, searchLimiter } from '../middleware/rateLimiter';
import { validateRequest } from '../middleware/validateRequest';
import type { ZodTypeAny } from 'zod';
import { SparePartPayloadSchema, PartialSparePartPayloadSchema } from "@shared";
import { requireListingType } from '../middleware/requireListingType';
import { LISTING_TYPE } from "@shared/enums/listingType";
import logger from "@esparex/core/utils/logger";

const router = Router();

/**
 * 🛡️ LEGACY PROXY LAYER
 * All routes here delegate to the appropriate listing controller (SSOT).
 * Log warnings to track legacy usage for eventual decommissioning.
 */

const logLegacyHit = (endpoint: string, req: Request) => {
    logger.warn('DEPRECATED_ROUTE_HIT', {
        event: 'DEPRECATED_ROUTE_HIT',
        route: endpoint,
        userId: (req.user as { _id?: string } | undefined)?._id ?? 'anonymous',
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        redirect: '/api/v1/listings',
    });
};

// Create
router.post(
    '/',
    protect,
    requireBusinessApproved,
    requireListingType(LISTING_TYPE.SPARE_PART),
    duplicateCooldownMiddleware(LISTING_TYPE.SPARE_PART),
    validateRequest(SparePartPayloadSchema as unknown as ZodTypeAny),
    createListingValidator,
    (req: Request, res: Response, next: NextFunction) => {
        logLegacyHit('POST /spare-part-listings', req);
        void createListingController.createListing(req, res, next);
    }
);

// Get All (Search)
router.get('/', searchLimiter, (req: Request, res: Response, next: NextFunction) => {
    logLegacyHit('GET /spare-part-listings', req);
    void getListingsController.getListings(req, res, next);
});

// Phone Reveal
router.get('/:id/phone', validateObjectId, extractUser, phoneRevealLimiter, (req: Request, res: Response, next: NextFunction) => {
    logLegacyHit('GET /spare-part-listings/:id/phone', req);
    void engagementController.getListingPhone(req, res, next);
});

// Update
router.put(
    '/:id',
    protect,
    requireBusinessApproved,
    validateObjectId,
    mutationLimiter,
    validateRequest(PartialSparePartPayloadSchema.passthrough() as unknown as ZodTypeAny),
    (req: Request, res: Response, next: NextFunction) => {
        logLegacyHit('PUT /spare-part-listings/:id', req);
        void editListingController.editListing(req, res, next);
    }
);

export default router;
