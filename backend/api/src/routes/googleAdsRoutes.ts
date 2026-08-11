import express from "express";
import { getPublicGoogleAdPlacements } from "../controllers/public/publicGoogleAdsController";
import { publicCacheControl } from "../middleware/publicCacheControl";

const router = express.Router();

router.use(publicCacheControl(300, 3600));

router.get("/google-ads/placements", getPublicGoogleAdPlacements);

export default router;
