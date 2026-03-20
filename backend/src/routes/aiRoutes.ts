import express from 'express';
import * as aiController from '../controllers/ai';
import { protect } from '../middleware/authMiddleware';
import { mutationLimiter } from '../middleware/rateLimiter';
import { validateRequest } from '../middleware/validateRequest';
import { aiGenerateSchema } from '../validators/ai.validator';

const router = express.Router();

router.post('/generate', protect, mutationLimiter, validateRequest(aiGenerateSchema), aiController.generate);

export default router;
