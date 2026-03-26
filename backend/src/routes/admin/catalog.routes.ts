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
router.get('/categories/counts', requirePermission('catalog:read'), catalogController.getCategoryCounts);
router.get('/categories/:id/schema', requirePermission('catalog:read'), validateObjectId, catalogController.getCategorySchema);

// ✅ FILTER / QUERY
router.get('/categories', requirePermission('catalog:read'), catalogController.getCategories);

// ✅ PARAM LAST
router.get('/categories/:id', requirePermission('catalog:read'), validateObjectId, catalogController.getCategoryById);
router.post('/categories', requirePermission('catalog:write'), adminMutationLimiter, catalogController.createCategory);
router.put('/categories/:id', requirePermission('catalog:write'), adminMutationLimiter, validateObjectId, catalogController.updateCategory);
router.put('/categories/:id/schema', requirePermission('catalog:write'), adminMutationLimiter, validateObjectId, catalogController.updateCategorySchema);
router.patch('/categories/:id/status', requirePermission('catalog:write'), adminMutationLimiter, validateObjectId, catalogController.toggleCategoryStatus);
router.delete('/categories/:id', requirePermission('catalog:write'), adminMutationLimiter, validateObjectId, catalogController.deleteCategory);

// ============================================
// BRANDS
// ============================================
// ✅ FILTER / QUERY
router.get('/brands', requirePermission('catalog:read'), catalogController.getBrands);

// ✅ PARAM LAST
router.get('/brands/:id', requirePermission('catalog:read'), validateObjectId, catalogController.getBrandById);
router.post('/brands', requirePermission('catalog:write'), adminMutationLimiter, catalogController.createBrand);
router.put('/brands/:id', requirePermission('catalog:write'), adminMutationLimiter, validateObjectId, catalogController.updateBrand);
router.patch('/brands/:id/status', requirePermission('catalog:write'), adminMutationLimiter, validateObjectId, catalogController.toggleBrandStatus);
router.patch('/brands/:id/approve', requirePermission('catalog:write'), adminMutationLimiter, validateObjectId, catalogController.approveBrand);
router.patch('/brands/:id/reject', requirePermission('catalog:write'), adminMutationLimiter, validateObjectId, catalogController.rejectBrand);
router.delete('/brands/:id', requirePermission('catalog:write'), adminMutationLimiter, validateObjectId, catalogController.deleteBrand);

// ============================================
// MODELS
// ============================================
// ✅ FILTER / QUERY
router.get('/models', requirePermission('catalog:read'), catalogController.getModels);

// ✅ PARAM LAST
router.get('/models/:id', requirePermission('catalog:read'), validateObjectId, catalogController.getModelById);
router.post('/models', requirePermission('catalog:write'), adminMutationLimiter, catalogController.createModel);
router.put('/models/:id', requirePermission('catalog:write'), adminMutationLimiter, validateObjectId, catalogController.updateModel);
router.patch('/models/:id/approve', requirePermission('catalog:write'), adminMutationLimiter, validateObjectId, catalogController.approveModel);
router.patch('/models/:id/reject', requirePermission('catalog:write'), adminMutationLimiter, validateObjectId, catalogController.rejectModel);
router.delete('/models/:id', requirePermission('catalog:write'), adminMutationLimiter, validateObjectId, catalogController.deleteModel);

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
router.get('/service-types', requirePermission('catalog:read'), catalogController.getServiceTypes);
router.get('/service-types/:id', requirePermission('catalog:read'), validateObjectId, catalogController.getServiceTypeById);
router.post('/service-types', requirePermission('catalog:write'), adminMutationLimiter, catalogController.createServiceType);
router.put('/service-types/:id', requirePermission('catalog:write'), adminMutationLimiter, validateObjectId, catalogController.updateServiceType);
router.patch('/service-types/:id/toggle-status', requirePermission('catalog:write'), adminMutationLimiter, validateObjectId, catalogController.toggleServiceTypeStatus);
router.delete('/service-types/:id', requirePermission('catalog:write'), adminMutationLimiter, validateObjectId, catalogController.deleteServiceType);

// ============================================
// SCREEN SIZES
// ============================================
router.get('/screen-sizes', requirePermission('catalog:read'), catalogController.getScreenSizes);
router.post('/screen-sizes', requirePermission('catalog:write'), adminMutationLimiter, catalogController.createScreenSize);
router.put('/screen-sizes/:id', requirePermission('catalog:write'), adminMutationLimiter, validateObjectId, catalogController.updateScreenSize);
router.delete('/screen-sizes/:id', requirePermission('catalog:write'), adminMutationLimiter, validateObjectId, catalogController.deleteScreenSize);

// ============================================
// GOVERNANCE
// ============================================
router.get('/governance/hierarchy-report', requirePermission('catalog:read'), catalogController.getHierarchyReport);
router.post('/governance/repair-hierarchy', requirePermission('catalog:write'), adminMutationLimiter, catalogController.runHierarchyRepair);
router.get('/governance/categories/:id/health', requirePermission('catalog:read'), validateObjectId, catalogController.getCategoryHealth);

export default router;
