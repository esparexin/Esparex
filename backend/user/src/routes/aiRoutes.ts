import express from 'express';
import * as aiController from '../controllers/ai/aiController';
import { protect } from '../middleware/authMiddleware';
import { mutationLimiter } from '../middleware/rateLimiter';
import { validateRequest } from '../middleware/validateRequest';
import { aiGenerateSchema } from '@esparex/core/validators/ai.validator';

const router = express.Router();

router.post('/generate', protect, mutationLimiter, validateRequest(aiGenerateSchema), aiController.generate);
router.post('/catalog-suggest', protect, mutationLimiter, aiController.catalogSuggest);

export default router;
