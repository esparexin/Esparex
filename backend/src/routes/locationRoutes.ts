import express from "express";
import * as locationController from "../controllers/locationController";
import { requireAdmin } from "../middleware/adminAuth";
import { searchLimiter } from '../middleware/rateLimiter';
import {
    validateLocationEventRequest
} from '../middleware/locationValidation';
import { validateRequest } from '../middleware/validateRequest';
import * as Validators from '../validators/location.validator';

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

// Hierarchical selectors
router.get("/states", searchLimiter, locationController.getStates);
router.get("/cities", searchLimiter, locationController.getCities);
router.get("/areas", searchLimiter, locationController.getAreas);

// Popular cities — dedicated route (SSOT, independently cacheable)
router.get("/popular", searchLimiter, locationController.getPopularLocations);

// Default map center/fallback city
router.get("/default-center", searchLimiter, locationController.getDefaultCenter);

// IP Geolocation — server-side proxy (keeps API key off the client)
router.get("/ip-locate", searchLimiter, locationController.ipLocate);

// Geospatial & Detection
router.get("/geocode", searchLimiter, locationController.geocode);

// Analytics
router.post("/log-event", searchLimiter, validateLocationEventRequest, validateRequest(Validators.logLocationEventSchema), locationController.logLocationEvent);

// Auto-detect & Ingest — create new location if not found in 2km radius
// Used by auto-detect feature to create locations when coordinates don't match existing ones
// 🔒 SECURITY: admin-only — prevents unauthorized location data injection.
router.post("/ingest", requireAdmin, searchLimiter, validateRequest(Validators.ingestLocationSchema), locationController.ingestLocation);

export default router;
