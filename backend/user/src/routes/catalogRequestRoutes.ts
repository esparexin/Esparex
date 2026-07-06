import express from 'express';
import { protect } from '../middleware/authMiddleware';
import { mutationLimiter, searchLimiter, catalogSuggestionLimiter } from '../middleware/rateLimiter';
import { validateRequest } from '../middleware/validateRequest';
import { createCatalogRequestSchema, catalogRequestListQuerySchema,  } from '@esparex/core/validators';;
import {
    createCatalogRequest,
    getMyCatalogRequests,
} from '../controllers/catalogRequestController';

const router = express.Router();

router.post(
    '/',
    protect,
    catalogSuggestionLimiter,
    validateRequest(createCatalogRequestSchema),
    createCatalogRequest
);

router.get(
    '/my',
    protect,
    searchLimiter,
    validateRequest({ query: catalogRequestListQuerySchema }),
    getMyCatalogRequests
);

export default router;
