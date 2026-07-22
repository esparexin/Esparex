import express from "express";
import * as locationController from "../controllers/location/locationController";
import { requireAdmin } from "../middleware/adminAuth";
import { searchLimiter } from '../middleware/rateLimiter';
import { validateRequest } from '../middleware/validateRequest';
import * as Validators from '@esparex/core/validators/location.validator';

const router = express.Router();

/**
 * Location Domain
 * ---------------------------------------------------------
 * Unified reference geography and geospatial services.
 * Mount Point: /api/v1/locations
 * ---------------------------------------------------------
 */

// Search (text autocomplete)
router.get("/", searchLimiter, locationController.searchLocations);
router.get("/pincode/:pincode", searchLimiter, locationController.lookupPincode);

import { publicCacheControl } from '../middleware/publicCacheControl';

// Hierarchical selectors — cached at edge for fast dropdown & filter responses
router.get("/states", searchLimiter, publicCacheControl(300, 3600), locationController.getStates);
router.get("/cities", searchLimiter, publicCacheControl(300, 3600), locationController.getCities);
router.get("/areas", searchLimiter, publicCacheControl(300, 3600), locationController.getAreas);

// Default map center/fallback city
router.get("/default-center", searchLimiter, publicCacheControl(300, 3600), locationController.getDefaultCenter);

// IP Geolocation — server-side proxy (keeps API key off the client)
router.get("/ip-locate", searchLimiter, locationController.ipLocate);

// Geospatial & Detection
router.get("/geocode", searchLimiter, locationController.geocode);

// Analytics
router.post("/log-event", searchLimiter, validateRequest(Validators.logLocationEventSchema), locationController.logLocationEvent);

// Auto-detect & Ingest — create new location if not found in 2km radius
// Used by auto-detect feature to create locations when coordinates don't match existing ones
// 🔒 SECURITY: admin-only — prevents unauthorized location data injection.
router.post("/ingest", requireAdmin, searchLimiter, validateRequest(Validators.ingestLocationSchema), locationController.ingestLocation);

export default router;
