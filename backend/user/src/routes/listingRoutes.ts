import { Router } from "express";
import * as getListingsController from "../controllers/listing/getListings.controller";
import * as createListingController from "../controllers/listing/createListing.controller";
import * as editListingController from "../controllers/listing/editListing.controller";
import * as engagementController from "../controllers/listing/engagement.controller";
import * as lifecycleController from "../controllers/listing/lifecycle.controller";
import * as statsController from "../controllers/listing/stats.controller";

import { protect, extractUser } from "../middleware/authMiddleware";
import { validateObjectId } from "../middleware/validateObjectId";
import { validateIdOrSlug } from "../middleware/validateIdOrSlug";
import { searchLimiter, mutationLimiter } from "../middleware/rateLimiter";
import { validateRequest } from "../middleware/validateRequest";
import { updateAdSchema } from "@esparex/core/validators/ad.validator";
import { idempotencyMiddleware } from "../middleware/idempotency";
import type { ZodTypeAny } from "zod";

const router = Router();

/**
 * Public Discovery Routes
 */

// GET /api/v1/listings/home
router.get("/home", searchLimiter, getListingsController.getHomeFeed);

// GET /api/v1/listings/trending
router.get("/trending", searchLimiter, getListingsController.getTrending);

// GET /api/v1/listings/nearby
router.get("/nearby", extractUser, searchLimiter, validateIdOrSlug('id'), getListingsController.getNearbyListings);

// GET /api/v1/listings/suggestions
router.get("/suggestions", searchLimiter, getListingsController.getListingSuggestions);

// GET /api/v1/listings
// Browse / Search
router.get("/", extractUser, searchLimiter, getListingsController.getListings);


/**
 * Protected Routes (Owner/Creator Only)
 */

// POST /api/v1/listings
// Unified creation entry point
router.post("/", protect, mutationLimiter, idempotencyMiddleware, createListingController.createListing);

// POST /api/v1/listings/upload-image
router.post("/upload-image", protect, mutationLimiter, createListingController.uploadImage);

// POST /api/v1/listings/upload-presign
router.post("/upload-presign", protect, mutationLimiter, createListingController.getUploadPresignedUrl);

// GET /api/v1/listings/mine/stats
// Unified fetch for user's listing counts across all types
router.get("/mine/stats", protect, statsController.getMyListingStats);

// GET /api/v1/listings/my/status-counts
router.get("/my/status-counts", protect, statsController.getMyListingStatusCounts);

// GET /api/v1/listings/mine
// Unified fetch for user's own listings (all types)
router.get("/mine", protect, statsController.getMyListings);

// GET /api/v1/listings/my
router.get("/my", protect, statsController.getMyTabListings);

/**
 * Public Detail Routes
 */

// GET /api/v1/listings/:id
// Publicly fetch listing by ID or Slug
router.get("/:id", validateIdOrSlug('id'), extractUser, getListingsController.getListingDetail);

// GET /api/v1/listings/:id/view
// Increment view count (public)
router.get("/:id/view", validateObjectId, searchLimiter, engagementController.incrementListingView);

// GET /api/v1/listings/:id/phone
// Reveal phone number (public with optional auth context)
router.get("/:id/phone", validateObjectId, extractUser, searchLimiter, engagementController.getListingPhone);

// PUT /api/v1/listings/:id/edit
// Strict edit with ownership validation
router.put("/:id/edit", protect, validateObjectId, mutationLimiter, validateRequest(updateAdSchema as unknown as ZodTypeAny), editListingController.editListing);

// PATCH /api/v1/listings/:id/sold
// SSOT: Required terminal state transition
router.patch("/:id/sold", protect, validateObjectId, mutationLimiter, lifecycleController.markListingSold);

// PATCH /api/v1/listings/:id/mark-sold
router.patch("/:id/mark-sold", protect, validateObjectId, mutationLimiter, lifecycleController.markListingStatusSold);

// PATCH /api/v1/listings/:id/deactivate
// Lifecycle: LIVE -> DEACTIVATED
router.patch("/:id/deactivate", protect, validateObjectId, mutationLimiter, lifecycleController.deactivateListing);

// DELETE /api/v1/listings/:id
// Lifecycle: Soft delete
router.delete("/:id", protect, validateObjectId, mutationLimiter, lifecycleController.deleteListing);

// POST /api/v1/listings/:id/repost
// Lifecycle: Repost expired/rejected listing
router.post("/:id/repost", protect, validateObjectId, mutationLimiter, idempotencyMiddleware, lifecycleController.repostListing);

// POST /api/v1/listings/:id/promote
// Promotion entry point
router.post("/:id/promote", protect, validateObjectId, mutationLimiter, lifecycleController.promoteListing);

// GET /api/v1/listings/:id/analytics
// Performance tracking
router.get("/:id/analytics", protect, validateObjectId, statsController.getListingAnalytics);

export default router;
