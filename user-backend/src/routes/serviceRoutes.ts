import express, { Request, Response, NextFunction } from 'express';
import * as listingController from '../controllers/listing/listingController';
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
    requireListingType(LISTING_TYPE.SERVICE),
    mutationLimiter,
    duplicateCooldownMiddleware(LISTING_TYPE.SERVICE),
    validateRequest(ServicePayloadSchema as unknown as ZodTypeAny),
    createListingValidator,
    enforceCreateServiceIdempotency,
    (req, res, next) => {
        logLegacyHit('POST /services');
        void listingController.createListing(req, res, next);
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
    (req, res, next) => {
        logLegacyHit('PUT /services/:id');
        void listingController.editListing(req, res, next);
    }
);

// Get All
router.get('/', searchLimiter, (req, res, next) => {
    logLegacyHit('GET /services');
    void listingController.getListings(req, res, next);
});

// View Increment
router.get('/:id/view', searchLimiter, validateIdOrSlug('id'), (req, res, next) => {
    logLegacyHit('GET /services/:id/view');
    void listingController.incrementListingView(req, res, next);
});

// Phone Reveal
router.get('/:id/phone', validateObjectId, extractUser, phoneRevealLimiter, (req, res, next) => {
    logLegacyHit('GET /services/:id/phone');
    void listingController.getListingPhone(req, res, next);
});

export default router;
