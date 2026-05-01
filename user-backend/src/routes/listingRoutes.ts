import { Router } from "express";
import * as listingController from "../controllers/listing/listingController";
import { protect, extractUser } from "../middleware/authMiddleware";
import { validateObjectId } from "../middleware/validateObjectId";
import { validateIdOrSlug } from "../middleware/validateIdOrSlug";
import { searchLimiter, mutationLimiter } from "../middleware/rateLimiter";
import { validateRequest } from "../middleware/validateRequest";
import { updateAdSchema } from "@core/validators/ad.validator";
import { idempotencyMiddleware } from "../middleware/idempotency";
import type { ZodTypeAny } from "zod";

const router = Router();

/**
 * Public Discovery Routes
 */

// GET /api/v1/listings/home
router.get("/home", searchLimiter, listingController.getHomeFeed);

// GET /api/v1/listings/trending
router.get("/trending", searchLimiter, listingController.getTrending);

// GET /api/v1/listings/nearby
router.get("/nearby", extractUser, searchLimiter, validateIdOrSlug('id'), listingController.getNearbyListings);

// GET /api/v1/listings/suggestions
router.get("/suggestions", searchLimiter, listingController.getListingSuggestions);

// GET /api/v1/listings
// Browse / Search
router.get("/", extractUser, searchLimiter, listingController.getListings);


/**
 * Protected Routes (Owner/Creator Only)
 */

// POST /api/v1/listings
// Unified creation entry point
router.post("/", protect, mutationLimiter, idempotencyMiddleware, listingController.createListing);

// POST /api/v1/listings/upload-image
router.post("/upload-image", protect, mutationLimiter, listingController.uploadImage);

// POST /api/v1/listings/upload-presign
router.post("/upload-presign", protect, mutationLimiter, listingController.getUploadPresignedUrl);

// GET /api/v1/listings/mine/stats
// Unified fetch for user's listing counts across all types
router.get("/mine/stats", protect, listingController.getMyListingStats);

// GET /api/v1/listings/mine
// Unified fetch for user's own listings (all types)
router.get("/mine", protect, listingController.getMyListings);

/**
 * Public Detail Routes
 */

// GET /api/v1/listings/:id
// Publicly fetch listing by ID or Slug
router.get("/:id", validateIdOrSlug('id'), extractUser, listingController.getListingDetail);

// GET /api/v1/listings/:id/view
// Increment view count (public)
router.get("/:id/view", validateObjectId, searchLimiter, listingController.incrementListingView);

// GET /api/v1/listings/:id/phone
// Reveal phone number (public with optional auth context)
router.get("/:id/phone", validateObjectId, extractUser, searchLimiter, listingController.getListingPhone);

// PUT /api/v1/listings/:id/edit
// Strict edit with ownership validation
router.put("/:id/edit", protect, validateObjectId, mutationLimiter, validateRequest(updateAdSchema as unknown as ZodTypeAny), listingController.editListing);

// PUT /api/v1/listings/:id/mark-sold
// Terminal state transition
router.put("/:id/mark-sold", protect, validateObjectId, mutationLimiter, listingController.markListingSold);

// PATCH /api/v1/listings/:id/deactivate
// Lifecycle: LIVE -> DEACTIVATED
router.patch("/:id/deactivate", protect, validateObjectId, mutationLimiter, listingController.deactivateListing);

// DELETE /api/v1/listings/:id
// Lifecycle: Soft delete
router.delete("/:id", protect, validateObjectId, mutationLimiter, listingController.deleteListing);

// POST /api/v1/listings/:id/repost
// Lifecycle: Repost expired/rejected listing
router.post("/:id/repost", protect, validateObjectId, mutationLimiter, idempotencyMiddleware, listingController.repostListing);

// POST /api/v1/listings/:id/promote
// Promotion entry point
router.post("/:id/promote", protect, validateObjectId, mutationLimiter, listingController.promoteListing);

// GET /api/v1/listings/:id/analytics
// Performance tracking
router.get("/:id/analytics", protect, validateObjectId, listingController.getListingAnalytics);

export default router;
