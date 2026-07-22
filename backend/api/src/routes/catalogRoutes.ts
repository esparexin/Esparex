import express from 'express';
import * as catalogController from '../controllers/catalog';
import { searchLimiter } from '../middleware/rateLimiter';
import { validateObjectId } from '../middleware/validateObjectId';

import { publicCacheControl } from '../middleware/publicCacheControl';

const router = express.Router();

router.use(publicCacheControl(300, 3600));

/* ==========================================================
   1. CATEGORIES
   ========================================================== */
router.get('/categories', searchLimiter, catalogController.getCategories);
router.get('/categories/counts', searchLimiter, catalogController.getCategoryCounts);
router.get('/categories/:id', searchLimiter, catalogController.getCategoryById);
router.get('/categories/:id/schema', searchLimiter, validateObjectId, catalogController.getCategorySchema);

/* ==========================================================
   2. BRANDS
   ========================================================== */
router.get('/brands', searchLimiter, catalogController.getBrands);
router.get('/brands/slug/:slug', searchLimiter, catalogController.getBrandBySlug);
router.get('/brands/:id', searchLimiter, validateObjectId, catalogController.getBrandById);

/* ==========================================================
   3. MODELS
   ========================================================== */
router.get('/models', searchLimiter, catalogController.getModels);
router.get('/models/slug/:slug', searchLimiter, catalogController.getModelBySlug);
router.get('/models/:id', searchLimiter, validateObjectId, catalogController.getModelById);

/* ==========================================================
   4. SPARE PARTS
   ========================================================== */
router.get('/spare-parts', searchLimiter, catalogController.getSpareParts);
router.get('/spare-parts/:id', validateObjectId, catalogController.getSparePartById);

/* ==========================================================
   5. REFERENCE DATA (Services, Screen Sizes)
   ========================================================== */

// Service Types
router.get('/service-types', catalogController.getServiceTypes);
router.get('/service-types/:id', validateObjectId, catalogController.getServiceTypeById);

// Screen Sizes
router.get('/screen-sizes', catalogController.getScreenSizes);
router.get('/screen-sizes/:id', validateObjectId, catalogController.getScreenSizeById);

export default router;
