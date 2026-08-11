import express from 'express';
import * as monetizationController from '../controllers/monetizationController';

const router = express.Router();

// Public ad resolution and telemetry
router.post('/resolve', monetizationController.resolveAd);
router.post('/:id/impression', monetizationController.recordImpression);
router.post('/:id/click', monetizationController.recordClick);

export default router;
