import express from "express";
import * as analyticsController from "../controllers/analytics/analyticsController";

const router = express.Router();

router.post("/post-ad-event", analyticsController.logPostAdEvent);

export default router;
