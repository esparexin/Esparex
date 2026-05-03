import express, { Request, Response, NextFunction } from 'express';
import * as createListingController from '../controllers/listing/createListing.controller';
import * as editListingController from '../controllers/listing/editListing.controller';
import * as getListingsController from '../controllers/listing/getListings.controller';
import * as engagementController from '../controllers/listing/engagement.controller';
import { protect, extractUser } from '../middleware/authMiddleware';
import { validateObjectId } from '../middleware/validateObjectId';
import { validateRequest } from '../middleware/validateRequest';
import { mutationLimiter, searchLimiter, phoneRevealLimiter } from '../middleware/rateLimiter';
import { ServicePayloadSchema, PartialServicePayloadSchema } from "@shared/schemas/servicePayload.schema";
import type { ZodTypeAny } from 'zod';
import { createListingValidator } from '../middleware/listing.validator';
import { enforceCreateServiceIdempotency } from '../middleware/idempotency';
import { requireBusinessApproved } from '../middleware/businessMiddleware';
import { duplicateCooldownMiddleware } from '../middleware/duplicateCooldownMiddleware';
import { requireListingType } from '../middleware/requireListingType';
import { LISTING_TYPE } from "@shared/enums/listingType";
import { validateIdOrSlug } from '../middleware/validateIdOrSlug';
import logger from "@core/utils/logger";

const router = express.Router();

/**
 * 🛡️ LEGACY PROXY LAYER
 * All routes here delegate to the appropriate listing controller (SSOT).
 * Log warnings to track legacy usage for eventual decommissioning.
 */

const logLegacyHit = (endpoint: string) => {
    logger.warn(`[DEPRECATED API HIT] ${endpoint} - Use /api/v1/listings instead.`);
};

// Create
router.post(
    '/',
    protect,
    requireBusinessApproved,
    requireListingType(LISTING_TYPE.SERVICE),
    mutationLimiter,
    duplicateCooldownMiddleware(LISTING_TYPE.SERVICE),
    validateRequest(ServicePayloadSchema as unknown as ZodTypeAny),
    createListingValidator,
    enforceCreateServiceIdempotency,
    (req: Request, res: Response, next: NextFunction) => {
        logLegacyHit('POST /services');
        void createListingController.createListing(req, res, next);
    }
);

// Update
router.put(
    '/:id',
    protect,
    requireBusinessApproved,
    validateObjectId,
    mutationLimiter,
    validateRequest(PartialServicePayloadSchema as unknown as ZodTypeAny),
    (req: Request, res: Response, next: NextFunction) => {
        logLegacyHit('PUT /services/:id');
        void editListingController.editListing(req, res, next);
    }
);

// Get All
router.get('/', searchLimiter, (req: Request, res: Response, next: NextFunction) => {
    logLegacyHit('GET /services');
    void getListingsController.getListings(req, res, next);
});

// View Increment
router.get('/:id/view', searchLimiter, validateIdOrSlug('id'), (req: Request, res: Response, next: NextFunction) => {
    logLegacyHit('GET /services/:id/view');
    void engagementController.incrementListingView(req, res, next);
});

// Phone Reveal
router.get('/:id/phone', validateObjectId, extractUser, phoneRevealLimiter, (req: Request, res: Response, next: NextFunction) => {
    logLegacyHit('GET /services/:id/phone');
    void engagementController.getListingPhone(req, res, next);
});

export default router;
