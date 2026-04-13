import express, { Request, Response, NextFunction } from "express";
import * as adController from "../controllers/ad";
import * as listingController from "../controllers/listingController";
import { protect, extractUser } from "../middleware/authMiddleware";
import { validateSearchParams } from "../validators/securityValidators";
import { mutationLimiter, searchLimiter, adPostLimiter } from "../middleware/rateLimiter";
import { validateObjectId } from "../middleware/validateObjectId";
import { validateRequest } from "../middleware/validateRequest";
import { enforceCreateAdIdempotency, idempotencyMiddleware } from "../middleware/idempotency";
import { fraudMiddleware } from "../middleware/fraudMiddleware";
import { createAdSchema, updateAdSchema } from "../validators/ad.validator";
import type { ZodTypeAny } from "zod";

import { duplicateCooldownMiddleware } from "../middleware/duplicateCooldownMiddleware";
import { createListingValidator } from "../validators/listing.validator";
import { requireVerifiedBusinessForServiceParts } from "../middleware/requireVerifiedBusiness";
import { requireListingType } from "../middleware/requireListingType";
import { LISTING_TYPE } from "../../../shared/enums/listingType";
import { sendErrorResponse } from "../utils/errorResponse";

const router = express.Router();
const LEGACY_AD_OWNER_ALIAS_CODE = "LEGACY_AD_USER_ID_ALIAS_REMOVED";

const hasOwn = (value: unknown, key: string): boolean =>
    Boolean(value && typeof value === "object" && Object.prototype.hasOwnProperty.call(value, key));

const rejectLegacyAdUserIdAlias = (req: Request, res: Response, next: NextFunction) => {
    if (!hasOwn(req.body, "userId")) return next();
    return sendErrorResponse(
        req,
        res,
        400,
        "`userId` alias is no longer accepted in ad write payloads. Use `sellerId` or authenticated owner context.",
        {
            code: LEGACY_AD_OWNER_ALIAS_CODE,
            details: {
                alias: "userId",
                canonical: "sellerId",
                source: "body",
                rolloutPhase: "PR-D",
            },
        }
    );
};

/* -------------------------------------------------------------------------- */
/* Public Routes                                                              */
/* -------------------------------------------------------------------------- */
router.get("/home", searchLimiter, adController.getHomeFeedAds);
router.get("/trending", searchLimiter, adController.getTrendingAds);

// Browse / Search ads
router.get("/", extractUser, searchLimiter, validateSearchParams, adController.getAds);

// Nearby ads (distance-first alias over canonical ads search service)
router.get("/nearby", extractUser, searchLimiter, validateSearchParams, adController.getNearbyAds);

// User's own ads
router.get("/my-ads", protect, validateSearchParams, adController.getMyAds);

// Search autocomplete suggestions
router.get("/suggestions", searchLimiter, adController.getSuggestions);

// Create ad
router.post(
    "/",
    protect,
    rejectLegacyAdUserIdAlias,
    adPostLimiter,
    requireVerifiedBusinessForServiceParts,
    requireListingType(LISTING_TYPE.AD),   // 🛡️ Rejects service/spare_part submitted via ad route
    duplicateCooldownMiddleware('ad'),
    fraudMiddleware,
    validateRequest(createAdSchema as unknown as ZodTypeAny),
    createListingValidator,
    enforceCreateAdIdempotency,
    adController.createAd
);

// Granular Image Upload (Enterprise Audit Standard)
router.post(
    "/upload-image",
    protect,
    mutationLimiter,
    adController.uploadImage
);

// Pre-signed S3 Upload URL — browser uploads directly to S3 (no file bytes through Node.js)
router.post(
    "/upload-presign",
    protect,
    mutationLimiter,
    adController.getUploadPresignedUrl
);

// Track ad view — use /listings/:id/view (Layer 2 canonical)
// GET /:id/view removed (superseded by listingRoutes)

// Reveal phone number (public with masking or private for authenticated users)
router.get("/:id/phone", validateObjectId, searchLimiter, listingController.getListingPhone);

// Update ad
// D1: PATCH update uses partial schema (updateAdSchema = PartialAdPayloadSchema.passthrough())
router.patch(
    "/:id",
    validateObjectId,
    protect,
    rejectLegacyAdUserIdAlias,
    mutationLimiter,
    validateRequest(updateAdSchema as unknown as ZodTypeAny),
    adController.updateAd
);



export default router;
