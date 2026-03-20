/**
 * CATALOG ROUTES
 * Domain: Categories, Brands, Models, Screen Sizes, Spare Parts, Service Types
 */
import { Router } from 'express';
import { validateObjectId } from '../../middleware/validateObjectId';
import { adminMutationLimiter } from '../../middleware/rateLimiter';
import { requirePermission } from '../../middleware/adminAuth';
import * as catalogController from '../../controllers/catalog';

const router = Router();

// ============================================
// CATEGORIES
// ============================================
// ✅ STATIC & COUNTS
router.get('/categories/counts', catalogController.getCategoryCounts);
router.get('/categories/:id/schema', validateObjectId, catalogController.getCategorySchema);

// ✅ FILTER / QUERY
router.get('/categories', catalogController.getCategories);

// ✅ PARAM LAST
router.get('/categories/:id', validateObjectId, catalogController.getCategoryById);
router.post('/categories', adminMutationLimiter, catalogController.createCategory);
router.put('/categories/:id', adminMutationLimiter, validateObjectId, catalogController.updateCategory);
router.put('/categories/:id/schema', adminMutationLimiter, validateObjectId, catalogController.updateCategorySchema);
router.patch('/categories/:id/status', adminMutationLimiter, validateObjectId, catalogController.toggleCategoryStatus);
router.delete('/categories/:id', adminMutationLimiter, validateObjectId, catalogController.deleteCategory);

// ============================================
// BRANDS
// ============================================
// ✅ FILTER / QUERY
router.get('/brands', catalogController.getBrands);

// ✅ PARAM LAST
router.get('/brands/:id', validateObjectId, catalogController.getBrandById);
router.post('/brands', adminMutationLimiter, catalogController.createBrand);
router.put('/brands/:id', adminMutationLimiter, validateObjectId, catalogController.updateBrand);
router.patch('/brands/:id/status', adminMutationLimiter, validateObjectId, catalogController.toggleBrandStatus);
router.patch('/brands/:id/approve', adminMutationLimiter, validateObjectId, catalogController.approveBrand);
router.patch('/brands/:id/reject', adminMutationLimiter, validateObjectId, catalogController.rejectBrand);
router.delete('/brands/:id', adminMutationLimiter, validateObjectId, catalogController.deleteBrand);

// ============================================
// MODELS
// ============================================
// ✅ FILTER / QUERY
router.get('/models', catalogController.getModels);

// ✅ PARAM LAST
router.get('/models/:id', validateObjectId, catalogController.getModelById);
router.post('/models', adminMutationLimiter, catalogController.createModel);
router.put('/models/:id', adminMutationLimiter, validateObjectId, catalogController.updateModel);
router.patch('/models/:id/approve', adminMutationLimiter, validateObjectId, catalogController.approveModel);
router.patch('/models/:id/reject', adminMutationLimiter, validateObjectId, catalogController.rejectModel);
router.delete('/models/:id', adminMutationLimiter, validateObjectId, catalogController.deleteModel);

// ============================================
// SPARE PARTS
// ============================================
// ✅ FILTER / QUERY
router.get('/spare-parts', requirePermission('catalog:read'), catalogController.getSpareParts);

// ✅ PARAM LAST
router.get('/spare-parts/:id', requirePermission('catalog:read'), validateObjectId, catalogController.getSparePartById);
router.post('/spare-parts', requirePermission('catalog:write'), adminMutationLimiter, catalogController.createSparePart);
router.put('/spare-parts/:id', requirePermission('catalog:write'), adminMutationLimiter, validateObjectId, catalogController.updateSparePart);
router.delete('/spare-parts/:id', requirePermission('catalog:write'), adminMutationLimiter, validateObjectId, catalogController.deleteSparePart);

// ============================================
// SERVICE TYPES
// ============================================
router.get('/service-types', catalogController.getServiceTypes);
router.get('/service-types/:id', validateObjectId, catalogController.getServiceTypeById);
router.post('/service-types', adminMutationLimiter, catalogController.createServiceType);
router.put('/service-types/:id', adminMutationLimiter, validateObjectId, catalogController.updateServiceType);
router.patch('/service-types/:id/toggle-status', adminMutationLimiter, validateObjectId, catalogController.toggleServiceTypeStatus);
router.delete('/service-types/:id', adminMutationLimiter, validateObjectId, catalogController.deleteServiceType);

// ============================================
// SCREEN SIZES
// ============================================
router.get('/screen-sizes', catalogController.getScreenSizes);
router.post('/screen-sizes', adminMutationLimiter, catalogController.createScreenSize);
router.put('/screen-sizes/:id', adminMutationLimiter, validateObjectId, catalogController.updateScreenSize);
router.delete('/screen-sizes/:id', adminMutationLimiter, validateObjectId, catalogController.deleteScreenSize);

// ============================================
// GOVERNANCE
// ============================================
router.get('/governance/hierarchy-report', requirePermission('catalog:read'), catalogController.getHierarchyReport);
router.post('/governance/repair-hierarchy', requirePermission('catalog:write'), adminMutationLimiter, catalogController.runHierarchyRepair);
router.get('/governance/categories/:id/health', requirePermission('catalog:read'), validateObjectId, catalogController.getCategoryHealth);

export default router;
