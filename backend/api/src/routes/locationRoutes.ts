import express from "express";
import * as locationController from "../controllers/location/locationController";
import { searchLimiter } from '../middleware/rateLimiter';
import { validateRequest } from '../middleware/validateRequest';
import * as Validators from '@esparex/core/validators/location.validator';

import { publicCacheControl, privateNoCacheControl } from '../middleware/publicCacheControl';

const router = express.Router();

/**
 * Location Domain
 * ---------------------------------------------------------
 * Unified reference geography and geospatial services.
 * Mount Point: /api/v1/locations
 * ---------------------------------------------------------
 */

// Search (text autocomplete)
router.get("/", publicCacheControl(300, 3600), searchLimiter, locationController.searchLocations);
router.get("/pincode/:pincode", publicCacheControl(300, 3600), searchLimiter, locationController.lookupPincode);

// Hierarchical selectors
router.get("/states", publicCacheControl(300, 3600), searchLimiter, locationController.getStates);
router.get("/cities", publicCacheControl(300, 3600), searchLimiter, locationController.getCities);
router.get("/areas", publicCacheControl(300, 3600), searchLimiter, locationController.getAreas);

// Default map center/fallback city
router.get("/default-center", publicCacheControl(300, 3600), searchLimiter, locationController.getDefaultCenter);

// IP Geolocation — server-side proxy (keeps API key off the client)
// 🔒 PRIVACY & SECURITY: Must NEVER be cached by public CDNs or intermediary proxies
router.get("/ip-locate", privateNoCacheControl(), searchLimiter, locationController.ipLocate);

// Geospatial & Detection
router.get("/geocode", publicCacheControl(300, 3600), searchLimiter, locationController.geocode);

// Analytics
router.post("/log-event", searchLimiter, validateRequest(Validators.logLocationEventSchema), locationController.logLocationEvent);

export default router;
