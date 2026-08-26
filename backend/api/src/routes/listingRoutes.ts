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
import { requireListingOwner } from "../middleware/ownershipGuard";
import { requireVerifiedBusinessForServiceParts } from "../middleware/businessMiddleware";
import { publicCacheControl } from "../middleware/publicCacheControl";
import type { ZodTypeAny } from "zod";

const router = Router();

/**
 * Public Discovery Routes
 */

// Discovery feed alias mapped to home feed
// stale-while-revalidate capped at 60s: feed content is real-time (active listings, expiry-driven).
// A longer stale window lets browsers/CDNs serve expired ads after Redis cache is invalidated.
router.get("/feed", searchLimiter, publicCacheControl(300, 60), getListingsController.getHomeFeed);

// GET /api/v1/listings/home
// stale-while-revalidate capped at 60s: see /feed comment above.
router.get("/home", searchLimiter, publicCacheControl(300, 60), getListingsController.getHomeFeed);

// GET /api/v1/listings/trending
router.get("/trending", searchLimiter, publicCacheControl(300, 3600), getListingsController.getTrending);

// GET /api/v1/listings/nearby
router.get("/nearby", searchLimiter, extractUser, validateIdOrSlug('id'), getListingsController.getNearbyListings);

// GET /api/v1/listings/suggestions
router.get("/suggestions", searchLimiter, publicCacheControl(300, 3600), getListingsController.getListingSuggestions);

// GET /api/v1/listings
// Browse / Search
router.get("/", searchLimiter, publicCacheControl(300, 3600), extractUser, getListingsController.getListings);


/**
 * Protected Routes (Owner/Creator Only)
 */

// POST /api/v1/listings
// Unified creation entry point
router.post("/", mutationLimiter, protect, idempotencyMiddleware, requireVerifiedBusinessForServiceParts, createListingController.createListing);

// POST /api/v1/listings/upload-presign
// Generate presigned S3 upload URL for listing media
router.post("/upload-presign", mutationLimiter, protect, createListingController.getPresignedUploadUrl);



// GET /api/v1/listings/mine/stats
// Unified fetch for user's listing counts across all types
router.get("/mine/stats", searchLimiter, protect, statsController.getMyListingStats);

// GET /api/v1/listings/my/status-counts
router.get("/my/status-counts", searchLimiter, protect, statsController.getMyListingStatusCounts);

// GET /api/v1/listings/mine
// Unified fetch for user's own listings (all types)
router.get("/mine", searchLimiter, protect, statsController.getMyListings);

// GET /api/v1/listings/my
router.get("/my", searchLimiter, protect, statsController.getMyTabListings);

/**
 * Public Detail Routes
 */

// GET /api/v1/listings/:id
// Publicly fetch listing by ID or Slug (extractUser first so owner can view non-live ads)
router.get("/:id", searchLimiter, extractUser, validateIdOrSlug('id'), getListingsController.getListingDetail);

// GET /api/v1/listings/:id/view
// Increment view count (public)
router.get("/:id/view", searchLimiter, validateObjectId, engagementController.incrementListingView);

// GET /api/v1/listings/:id/phone
// Reveal phone number (public with optional auth context)
router.get("/:id/phone", searchLimiter, validateObjectId, extractUser, engagementController.getListingPhone);

// PATCH /api/v1/listings/:id/edit
// Strict edit with ownership validation (Standardized)
router.patch("/:id/edit", mutationLimiter, protect, validateObjectId, requireListingOwner, requireVerifiedBusinessForServiceParts, validateRequest(updateAdSchema as ZodTypeAny), editListingController.editListing);

// PATCH /api/v1/listings/:id/sold
// SSOT: Required terminal state transition
router.patch("/:id/sold", mutationLimiter, protect, validateObjectId, requireListingOwner, lifecycleController.markListingSold);

// PATCH /api/v1/listings/:id/deactivate
// Lifecycle: LIVE -> DEACTIVATED
router.patch("/:id/deactivate", mutationLimiter, protect, validateObjectId, requireListingOwner, lifecycleController.deactivateListing);

// PATCH /api/v1/listings/:id/activate
// Lifecycle: DEACTIVATED -> LIVE (immediate)
router.patch("/:id/activate", mutationLimiter, protect, validateObjectId, requireListingOwner, requireVerifiedBusinessForServiceParts, lifecycleController.activateListing);

// DELETE /api/v1/listings/:id
// Lifecycle: Soft delete
router.delete("/:id", mutationLimiter, protect, validateObjectId, requireListingOwner, lifecycleController.deleteListing);

// POST /api/v1/listings/:id/repost
// Lifecycle: Repost expired/rejected listing
router.post("/:id/repost", mutationLimiter, protect, validateObjectId, requireListingOwner, requireVerifiedBusinessForServiceParts, idempotencyMiddleware, lifecycleController.repostListing);

// POST /api/v1/listings/:id/promote
// Promotion entry point
router.post("/:id/promote", mutationLimiter, protect, validateObjectId, requireListingOwner, requireVerifiedBusinessForServiceParts, lifecycleController.promoteListing);

// GET /api/v1/listings/:id/analytics
// Performance tracking
router.get("/:id/analytics", searchLimiter, protect, validateObjectId, requireListingOwner, statsController.getListingAnalytics);

export default router;
