import express from "express";
import * as getListingsController from "../controllers/listing/getListings.controller";
import * as createListingController from "../controllers/listing/createListing.controller";
import * as editListingController from "../controllers/listing/editListing.controller";
import { protect, extractUser } from "../middleware/authMiddleware";
import { validateSearchParams } from "../middleware/securityValidators";
import { mutationLimiter, searchLimiter, adPostLimiter } from "../middleware/rateLimiter";
import { validateObjectId } from "../middleware/validateObjectId";
import { validateRequest } from "../middleware/validateRequest";
import { enforceCreateAdIdempotency } from "../middleware/idempotency";
import { fraudMiddleware } from "../middleware/fraudMiddleware";
import { createAdSchema, updateAdSchema } from "@core/validators/ad.validator";
import type { ZodTypeAny } from "zod";
import { duplicateCooldownMiddleware } from "../middleware/duplicateCooldownMiddleware";
import { createListingValidator } from "../middleware/listing.validator";
import { requireVerifiedBusinessForServiceParts } from "../middleware/requireVerifiedBusiness";
import { requireListingType } from "../middleware/requireListingType";
import { LISTING_TYPE } from "@shared/enums/listingType";
import logger from "@core/utils/logger";

const router = express.Router();

/**
 * 🛡️ LEGACY PROXY LAYER
 * All routes here delegate to the appropriate listing controller (SSOT).
 * Log warnings to track legacy usage for eventual decommissioning.
 */

const logLegacyHit = (endpoint: string, req: express.Request) => {
    logger.warn('DEPRECATED_ROUTE_HIT', {
        event: 'DEPRECATED_ROUTE_HIT',
        route: endpoint,
        userId: (req.user as { _id?: string } | undefined)?._id ?? 'anonymous',
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        redirect: '/api/v1/listings',
    });
};

// Home Feed
router.get("/home", searchLimiter, (req, res, next) => {
    logLegacyHit('GET /ads/home', req);
    void getListingsController.getHomeFeed(req, res, next);
});

// Trending
router.get("/trending", searchLimiter, (req, res, next) => {
    logLegacyHit('GET /ads/trending', req);
    void getListingsController.getTrending(req, res, next);
});

// Search
router.get("/", extractUser, searchLimiter, validateSearchParams, (req, res, next) => {
    logLegacyHit('GET /ads', req);
    void getListingsController.getListings(req, res, next);
});

// Nearby
router.get("/nearby", extractUser, searchLimiter, validateSearchParams, (req, res, next) => {
    logLegacyHit('GET /ads/nearby', req);
    void getListingsController.getNearbyListings(req, res, next);
});

// Suggestions
router.get("/suggestions", searchLimiter, (req, res, next) => {
    logLegacyHit('GET /ads/suggestions', req);
    void getListingsController.getListingSuggestions(req, res, next);
});

// Create
router.post(
    "/",
    protect,
    adPostLimiter,
    requireVerifiedBusinessForServiceParts,
    requireListingType(LISTING_TYPE.AD),
    duplicateCooldownMiddleware('ad'),
    fraudMiddleware,
    validateRequest(createAdSchema as unknown as ZodTypeAny),
    createListingValidator,
    enforceCreateAdIdempotency,
    (req, res, next) => {
        logLegacyHit('POST /ads', req);
        void createListingController.createListing(req, res, next);
    }
);

// Upload Image
router.post("/upload-image", protect, mutationLimiter, (req, res, next) => {
    logLegacyHit('POST /ads/upload-image', req);
    void createListingController.uploadImage(req, res, next);
});

// Upload Presign
router.post("/upload-presign", protect, mutationLimiter, (req, res, next) => {
    logLegacyHit('POST /ads/upload-presign', req);
    void createListingController.getUploadPresignedUrl(req, res, next);
});

// Update (Partial)
router.patch(
    "/:id",
    validateObjectId,
    protect,
    mutationLimiter,
    validateRequest(updateAdSchema as unknown as ZodTypeAny),
    (req, res, next) => {
        logLegacyHit('PATCH /ads/:id');
        void editListingController.editListing(req, res, next);
    }
);

export default router;
