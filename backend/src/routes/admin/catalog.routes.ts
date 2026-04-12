/**
 * CATALOG ROUTES
 * Domain: Categories, Brands, Models, Screen Sizes, Spare Parts, Service Types
 */
import { Router } from 'express';
import { validateObjectId } from '../../middleware/validateObjectId';
import { adminMutationLimiter } from '../../middleware/rateLimiter';
import { requirePermission } from '../../middleware/adminAuth';
import { validateRequest } from '../../middleware/validateRequest';
import * as catalogController from '../../controllers/catalog';
import * as Validators from '../../validators/catalog.validator';

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
router.post('/categories', requirePermission('catalog:write'), adminMutationLimiter, validateRequest(Validators.categoryCreateSchema), catalogController.createCategory);
router.put('/categories/:id', requirePermission('catalog:write'), adminMutationLimiter, validateObjectId, validateRequest(Validators.categoryUpdateSchema), catalogController.updateCategory);
router.put('/categories/:id/schema', requirePermission('catalog:write'), adminMutationLimiter, validateObjectId, validateRequest(Validators.categorySchemaUpdateBodySchema), catalogController.updateCategorySchema);
router.patch('/categories/:id/status', requirePermission('catalog:write'), adminMutationLimiter, validateObjectId, validateRequest(Validators.toggleCategoryStatusSchema), catalogController.toggleCategoryStatus);
router.delete('/categories/:id', requirePermission('catalog:write'), adminMutationLimiter, validateObjectId, catalogController.deleteCategory);

// ============================================
// BRANDS
// ============================================
// ✅ FILTER / QUERY
router.get('/brands', requirePermission('catalog:read'), catalogController.getBrands);

// ✅ PARAM LAST
router.get('/brands/:id', requirePermission('catalog:read'), validateObjectId, catalogController.getBrandById);
router.post('/brands', requirePermission('catalog:write'), adminMutationLimiter, validateRequest(Validators.brandCreateSchema), catalogController.createBrand);
router.put('/brands/:id', requirePermission('catalog:write'), adminMutationLimiter, validateObjectId, validateRequest(Validators.brandUpdateSchema), catalogController.updateBrand);
router.patch('/brands/:id/status', requirePermission('catalog:write'), adminMutationLimiter, validateObjectId, catalogController.toggleBrandStatus);
router.patch('/brands/:id/approve', requirePermission('catalog:write'), adminMutationLimiter, validateObjectId, catalogController.approveBrand);
router.patch('/brands/:id/reject', requirePermission('catalog:write'), adminMutationLimiter, validateObjectId, validateRequest(Validators.rejectionSchema), catalogController.rejectBrand);
router.delete('/brands/:id', requirePermission('catalog:write'), adminMutationLimiter, validateObjectId, catalogController.deleteBrand);

// ============================================
// MODELS
// ============================================
// ✅ FILTER / QUERY
router.get('/models', requirePermission('catalog:read'), catalogController.getModels);

// ✅ PARAM LAST
router.get('/models/:id', requirePermission('catalog:read'), validateObjectId, catalogController.getModelById);
router.post('/models', requirePermission('catalog:write'), adminMutationLimiter, validateRequest(Validators.modelCreateSchema), catalogController.createModel);
router.put('/models/:id', requirePermission('catalog:write'), adminMutationLimiter, validateObjectId, validateRequest(Validators.modelUpdateSchema), catalogController.updateModel);
router.patch('/models/:id/status', requirePermission('catalog:write'), adminMutationLimiter, validateObjectId, catalogController.toggleModelStatus);
router.patch('/models/:id/approve', requirePermission('catalog:write'), adminMutationLimiter, validateObjectId, catalogController.approveModel);
router.patch('/models/:id/reject', requirePermission('catalog:write'), adminMutationLimiter, validateObjectId, validateRequest(Validators.rejectionSchema), catalogController.rejectModel);
router.delete('/models/:id', requirePermission('catalog:write'), adminMutationLimiter, validateObjectId, catalogController.deleteModel);

// ============================================
// SPARE PARTS
// ============================================
// ✅ FILTER / QUERY
router.get('/spare-parts', requirePermission('catalog:read'), catalogController.getSpareParts);

// ✅ PARAM LAST
router.get('/spare-parts/:id', requirePermission('catalog:read'), validateObjectId, catalogController.getSparePartById);
router.post('/spare-parts', requirePermission('catalog:write'), adminMutationLimiter, validateRequest(Validators.sparePartCreateSchema), catalogController.createSparePart);
router.put('/spare-parts/:id', requirePermission('catalog:write'), adminMutationLimiter, validateObjectId, validateRequest(Validators.sparePartUpdateSchema), catalogController.updateSparePart);
router.patch('/spare-parts/:id/toggle-status', requirePermission('catalog:write'), adminMutationLimiter, validateObjectId, catalogController.toggleSparePartStatus);
router.delete('/spare-parts/:id', requirePermission('catalog:write'), adminMutationLimiter, validateObjectId, catalogController.deleteSparePart);

// ============================================
// SERVICE TYPES
// ============================================
router.get('/service-types', requirePermission('catalog:read'), catalogController.getServiceTypes);
router.get('/service-types/:id', requirePermission('catalog:read'), validateObjectId, catalogController.getServiceTypeById);
router.post('/service-types', requirePermission('catalog:write'), adminMutationLimiter, validateRequest(Validators.serviceTypeCreateSchema), catalogController.createServiceType);
router.put('/service-types/:id', requirePermission('catalog:write'), adminMutationLimiter, validateObjectId, validateRequest(Validators.serviceTypeUpdateSchema), catalogController.updateServiceType);
router.patch('/service-types/:id/toggle-status', requirePermission('catalog:write'), adminMutationLimiter, validateObjectId, catalogController.toggleServiceTypeStatus);
router.delete('/service-types/:id', requirePermission('catalog:write'), adminMutationLimiter, validateObjectId, catalogController.deleteServiceType);

// ============================================
// SCREEN SIZES
// ============================================
router.get('/screen-sizes', requirePermission('catalog:read'), catalogController.getScreenSizes);
router.post('/screen-sizes', requirePermission('catalog:write'), adminMutationLimiter, validateRequest(Validators.screenSizeCreateSchema), catalogController.createScreenSize);
router.put('/screen-sizes/:id', requirePermission('catalog:write'), adminMutationLimiter, validateObjectId, validateRequest(Validators.screenSizeUpdateSchema), catalogController.updateScreenSize);
router.patch('/screen-sizes/:id/toggle-status', requirePermission('catalog:write'), adminMutationLimiter, validateObjectId, catalogController.toggleScreenSizeStatus);
router.delete('/screen-sizes/:id', requirePermission('catalog:write'), adminMutationLimiter, validateObjectId, catalogController.deleteScreenSize);

// ============================================
// GOVERNANCE
// ============================================
router.get('/governance/hierarchy-report', requirePermission('catalog:read'), catalogController.getHierarchyReport);
router.get('/governance/hierarchy-tree', requirePermission('catalog:read'), catalogController.getHierarchyTree);
router.post('/governance/repair-hierarchy', requirePermission('catalog:write'), adminMutationLimiter, catalogController.runHierarchyRepair);
router.get('/governance/categories/:id/health', requirePermission('catalog:read'), validateObjectId, catalogController.getCategoryHealth);

export default router;
