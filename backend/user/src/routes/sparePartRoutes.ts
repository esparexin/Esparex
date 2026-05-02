import { Router, Request, Response, NextFunction } from 'express';
import { protect, extractUser } from '../middleware/authMiddleware';
import { requireBusinessApproved } from '../middleware/businessMiddleware';
import { validateObjectId } from '../middleware/validateObjectId';
import * as listingController from '../controllers/listing/listingController';
import { duplicateCooldownMiddleware } from '../middleware/duplicateCooldownMiddleware';
import { createListingValidator } from '../middleware/listing.validator';
import { phoneRevealLimiter, mutationLimiter, searchLimiter } from '../middleware/rateLimiter';
import { validateRequest } from '../middleware/validateRequest';
import type { ZodTypeAny } from 'zod';
import { SparePartPayloadSchema, PartialSparePartPayloadSchema } from "@shared/schemas/sparePartPayload.schema";
import { requireListingType } from '../middleware/requireListingType';
import { LISTING_TYPE } from "@shared/enums/listingType";
import logger from "@core/utils/logger";

const router = Router();

/**
 * 🛡️ LEGACY PROXY LAYER
 * All routes here delegate to listingController.ts (SSOT).
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
    requireListingType(LISTING_TYPE.SPARE_PART),
    duplicateCooldownMiddleware(LISTING_TYPE.SPARE_PART),
    validateRequest(SparePartPayloadSchema as unknown as ZodTypeAny),
    createListingValidator,
    (req: Request, res: Response, next: NextFunction) => {
        logLegacyHit('POST /spare-part-listings');
        void listingController.createListing(req, res, next);
    }
);

// Get All (Search)
router.get('/', searchLimiter, (req: Request, res: Response, next: NextFunction) => {
    logLegacyHit('GET /spare-part-listings');
    void listingController.getListings(req, res, next);
});

// Phone Reveal
router.get('/:id/phone', validateObjectId, extractUser, phoneRevealLimiter, (req: Request, res: Response, next: NextFunction) => {
    logLegacyHit('GET /spare-part-listings/:id/phone');
    void listingController.getListingPhone(req, res, next);
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
        logLegacyHit('PUT /spare-part-listings/:id');
        void listingController.editListing(req, res, next);
    }
);

export default router;
