import express from "express";
import * as adController from "../controllers/ad";
import { protect, extractUser } from "../middleware/authMiddleware";
import { validateSearchParams } from "../validators/securityValidators";
import { mutationLimiter, searchLimiter, adPostLimiter } from "../middleware/rateLimiter";
import { validateObjectId } from "../middleware/validateObjectId";
import { validateRequest } from "../middleware/validateRequest";
import { enforceCreateAdIdempotency, idempotencyMiddleware } from "../middleware/idempotency";
import { fraudMiddleware } from "../middleware/fraudMiddleware";
import { AdPayloadSchema, PartialAdPayloadSchema } from "../../../shared/schemas/adPayload.schema";
import type { ZodTypeAny } from "zod";
import { validateIdOrSlug } from "../middleware/validateIdOrSlug";
import { promoteAdSchema } from "../validators/promotion.validator";
import { markAsSoldSchema } from "../validators/ad.validator";
import { duplicateCooldownMiddleware } from "../middlewares/duplicateCooldownMiddleware";
import { createListingValidator } from "../validators/listing.validator";

const router = express.Router();

/* -------------------------------------------------------------------------- */
/* Public Routes                                                              */
/* -------------------------------------------------------------------------- */

// DEPRECATED: /ads/public/home — use /ads/home instead.
// Left in place to return 410 so any lingering clients get an explicit
// signal rather than a silent 404 or stale 200.
router.get("/public/home", searchLimiter, (req, res) => {
    res.set("Link", `<${req.baseUrl}/home>; rel="successor-version"`);
    res.status(410).json({
        success: false,
        message: "This endpoint has been retired. Use GET /ads/home instead.",
        canonical: "/api/v1/ads/home",
    });
});
router.get("/home", searchLimiter, adController.getHomeFeedAds);
router.get("/trending", searchLimiter, adController.getTrendingAds);

// Browse / Search ads
router.get("/", extractUser, searchLimiter, validateSearchParams, adController.getAds);

// Nearby ads (distance-first alias over canonical ads search service)
router.get("/nearby", extractUser, searchLimiter, validateSearchParams, adController.getNearbyAds);

// User's own ads stats
router.get("/my-ads/stats", protect, adController.getMyAdsStats);

// User's own ads
router.get("/my-ads", protect, validateSearchParams, adController.getMyAds);

// Search autocomplete suggestions
router.get("/suggestions", searchLimiter, adController.getSuggestions);

// Similar ads by source listing
router.get("/:id/similar", validateObjectId, searchLimiter, adController.getSimilarAds);

// Get single ad (SEO-safe, public, optionally authenticated for owners)
router.get("/:id", validateIdOrSlug('id'), extractUser, adController.getPublicAdById);

// Create ad
router.post(
    "/",
    protect,
    adPostLimiter,
    duplicateCooldownMiddleware('ad'),
    fraudMiddleware,
    validateRequest(AdPayloadSchema as unknown as ZodTypeAny),
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

// Update ad
router.patch(
    "/:id",
    validateObjectId,
    protect,
    mutationLimiter,
    fraudMiddleware,
    validateRequest(PartialAdPayloadSchema as unknown as ZodTypeAny),
    idempotencyMiddleware,
    adController.updateAd
);

// Promote ad
router.patch(
    "/:id/promote",
    validateObjectId,
    protect,
    validateRequest(promoteAdSchema),
    idempotencyMiddleware,
    adController.promoteAd
);

// Mark as sold
router.patch("/:id/sold", validateObjectId, protect, validateRequest(markAsSoldSchema), idempotencyMiddleware, adController.markAsSold);

// Repost expired/rejected ad
router.post("/:id/repost", validateObjectId, protect, mutationLimiter, idempotencyMiddleware, adController.repostAd);

// Track ad view (public analytics endpoint)
router.get("/:id/view", validateObjectId, searchLimiter, adController.incrementAdView);

// Reveal phone number (public with masking or private for authenticated users)
router.get("/:id/phone", validateObjectId, searchLimiter, adController.getAdPhone);

// Delete ad
router.delete("/:id", validateObjectId, protect, idempotencyMiddleware, adController.deleteAd);

export default router;
