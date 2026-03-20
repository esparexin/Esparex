import express from 'express';
import * as catalogController from '../controllers/catalog';
import { protect } from '../middleware/authMiddleware';
import { requireAdmin, requirePermission } from '../middleware/adminAuth';
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
router.get('/categories/:id', searchLimiter, validateObjectId, catalogController.getCategoryById);
router.get('/categories/:id/schema', searchLimiter, validateObjectId, catalogController.getCategorySchema);
router.put('/categories/:id/schema', requireAdmin, validateObjectId, catalogController.updateCategorySchema);
router.post('/categories', requireAdmin, validateRequest(Validators.categoryCreateSchema), catalogController.createCategory);
router.put('/categories/:id', requireAdmin, validateObjectId, validateRequest(Validators.categoryUpdateSchema), catalogController.updateCategory);
router.patch('/categories/:id/status', requireAdmin, validateObjectId, validateRequest(Validators.toggleCategoryStatusSchema), catalogController.toggleCategoryStatus);
router.delete('/categories/:id', requireAdmin, validateObjectId, catalogController.deleteCategory);

/* ==========================================================
   2. BRANDS
   ========================================================== */
router.get('/brands', searchLimiter, catalogController.getBrands);
router.get('/brands/:id', searchLimiter, validateObjectId, catalogController.getBrandById);
router.post('/brands', requireAdmin, requirePermission('catalog:write'), validateRequest(Validators.brandCreateSchema), catalogController.createBrand);
router.put('/brands/:id', requireAdmin, validateObjectId, validateRequest(Validators.brandUpdateSchema), catalogController.updateBrand);
router.patch('/brands/:id/status', requireAdmin, validateObjectId, validateRequest(Validators.brandStatusToggleSchema), catalogController.toggleBrandStatus);
router.patch('/brands/:id/approve', requireAdmin, validateObjectId, catalogController.approveBrand);
router.patch('/brands/:id/reject', requireAdmin, validateObjectId, validateRequest(Validators.rejectionSchema), catalogController.rejectBrand);
router.delete('/brands/:id', requireAdmin, validateObjectId, catalogController.deleteBrand);

/* ==========================================================
   3. MODELS
   ========================================================== */
router.get('/models', searchLimiter, catalogController.getModels);
router.get('/models/:id', searchLimiter, validateObjectId, catalogController.getModelById);
router.post('/models', requireAdmin, requirePermission('catalog:write'), validateRequest(Validators.modelCreateSchema), catalogController.createModel);
router.put('/models/:id', requireAdmin, validateObjectId, validateRequest(Validators.modelUpdateSchema), catalogController.updateModel);
router.patch('/models/:id/approve', requireAdmin, validateObjectId, catalogController.approveModel);
router.patch('/models/:id/reject', requireAdmin, validateObjectId, validateRequest(Validators.rejectionSchema), catalogController.rejectModel);
router.delete('/models/:id', requireAdmin, validateObjectId, catalogController.deleteModel);
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
router.post('/spare-parts', requireAdmin, validateRequest(Validators.sparePartCreateSchema), catalogController.createSparePart);
router.put('/spare-parts/:id', requireAdmin, validateObjectId, validateRequest(Validators.sparePartUpdateSchema), catalogController.updateSparePart);
router.delete('/spare-parts/:id', requireAdmin, validateObjectId, catalogController.deleteSparePart);

/* ==========================================================
   5. REFERENCE DATA (Services, Screen Sizes)
   ========================================================== */

// Service Types
router.get('/service-types', catalogController.getServiceTypes);
router.get('/service-types/:id', validateObjectId, catalogController.getServiceTypeById);
router.post('/service-types', requireAdmin, requirePermission('catalog:write'), validateRequest(Validators.serviceTypeCreateSchema), catalogController.createServiceType);
router.put('/service-types/:id', requireAdmin, validateObjectId, validateRequest(Validators.serviceTypeUpdateSchema), catalogController.updateServiceType);
router.patch(
   '/service-types/:id/toggle-status',
   requireAdmin,
   validateObjectId,
   catalogController.toggleServiceTypeStatus
);
router.delete('/service-types/:id', requireAdmin, validateObjectId, catalogController.deleteServiceType);

// Screen Sizes
router.get('/screen-sizes', catalogController.getScreenSizes);
router.get('/screen-sizes/:id', validateObjectId, catalogController.getScreenSizeById);
router.post('/screen-sizes', requireAdmin, requirePermission('catalog:write'), validateRequest(Validators.screenSizeCreateSchema), catalogController.createScreenSize);
router.put('/screen-sizes/:id', requireAdmin, validateObjectId, validateRequest(Validators.screenSizeUpdateSchema), catalogController.updateScreenSize);
router.delete('/screen-sizes/:id', requireAdmin, validateObjectId, catalogController.deleteScreenSize);


export default router;
