import express from 'express';
import * as catalogController from '../controllers/catalog';
import { protect } from '../middleware/authMiddleware';
import { mutationLimiter, searchLimiter } from '../middleware/rateLimiter';
import { validateObjectId } from '../middleware/validateObjectId';
import { validateRequest } from '../middleware/validateRequest';
import * as Validators from '../validators/catalog.validator';

const router = express.Router();

// Prevent browser/API caching of dynamic catalog JSON to avoid stale 304-based empty UI states.
router.use((req, res, next) => {
   if (req.method === 'GET') {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Surrogate-Control', 'no-store');
   }
   next();
});

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
router.post(
   '/models/ensure',
   protect,
   mutationLimiter,
   validateRequest(Validators.ensureModelSchema),
   catalogController.ensureModel
);

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
