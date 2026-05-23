import express from 'express';
import { requireAdmin, requirePermission } from '../middleware/adminAuth';
import { validateObjectId } from '../middleware/validateObjectId';
import * as adminCatalog from '@esparex/core/controllers/admin/catalog';
import { adminLimiter, adminMutationLimiter } from '../middleware/rateLimiter';
import { deprecateMethod } from '../middleware/deprecations';

const router = express.Router();

router.use(requireAdmin);
router.use(adminLimiter);
router.use((req, res, next) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method.toUpperCase())) {
        return adminMutationLimiter(req, res, () => {
            requirePermission('catalog:write')(req, res, next);
        });
    }
    return next();
});

router.get('/categories', adminCatalog.getCategories);
router.get('/categories/counts', adminCatalog.getCategoryCounts);
router.get('/categories/:id', adminCatalog.getCategoryById);
router.post('/categories', adminCatalog.createCategory);
router.patch('/categories/:id', adminCatalog.updateCategory);
router.put('/categories/:id', deprecateMethod('PATCH'), adminCatalog.updateCategory);
router.delete('/categories/:id', adminCatalog.deleteCategory);
router.get('/categories/:id/schema', adminCatalog.getCategorySchema);
router.patch('/categories/:id/schema', adminCatalog.updateCategorySchema);
router.put('/categories/:id/schema', deprecateMethod('PATCH'), adminCatalog.updateCategorySchema);
router.patch('/categories/:id/status', adminCatalog.toggleCategoryStatus);

router.get('/brands', adminCatalog.getBrands);
router.get('/brands/:id', adminCatalog.getBrandById);
router.post('/brands', adminCatalog.createBrand);
router.patch('/brands/:id', adminCatalog.updateBrand);
router.put('/brands/:id', deprecateMethod('PATCH'), adminCatalog.updateBrand);
router.patch('/brands/:id/status', adminCatalog.toggleBrandStatus);
router.delete('/brands/:id', validateObjectId, adminCatalog.deleteBrand);
router.patch('/brands/:id/approve', adminCatalog.approveBrand);
router.patch('/brands/:id/reject', adminCatalog.rejectBrand);

router.get('/models', adminCatalog.getModels);
router.get('/models/:id', adminCatalog.getModelById);
router.post('/models', adminCatalog.createModel);
router.patch('/models/:id', adminCatalog.updateModel);
router.put('/models/:id', deprecateMethod('PATCH'), adminCatalog.updateModel);
router.patch('/models/:id/status', adminCatalog.toggleModelStatus);
router.delete('/models/:id', adminCatalog.deleteModel);
router.patch('/models/:id/approve', adminCatalog.approveModel);
router.patch('/models/:id/reject', adminCatalog.rejectModel);

router.get('/spare-parts', adminCatalog.getSpareParts);
router.get('/spare-parts/:id', adminCatalog.getSparePartById);
router.post('/spare-parts', adminCatalog.createSparePart);
router.patch('/spare-parts/:id', adminCatalog.updateSparePart);
router.put('/spare-parts/:id', deprecateMethod('PATCH'), adminCatalog.updateSparePart);
router.patch('/spare-parts/:id/toggle-status', adminCatalog.toggleSparePartStatus);
router.delete('/spare-parts/:id', adminCatalog.deleteSparePart);

router.get('/service-types', adminCatalog.getServiceTypes);
router.get('/service-types/:id', adminCatalog.getServiceTypeById);
router.post('/service-types', adminCatalog.createServiceType);
router.patch('/service-types/:id', adminCatalog.updateServiceType);
router.put('/service-types/:id', deprecateMethod('PATCH'), adminCatalog.updateServiceType);
router.patch('/service-types/:id/toggle-status', adminCatalog.toggleServiceTypeStatus);
router.delete('/service-types/:id', adminCatalog.deleteServiceType);

router.get('/screen-sizes', adminCatalog.getScreenSizes);
router.get('/screen-sizes/:id', adminCatalog.getScreenSizeById);
router.post('/screen-sizes', adminCatalog.createScreenSize);
router.patch('/screen-sizes/:id', adminCatalog.updateScreenSize);
router.put('/screen-sizes/:id', deprecateMethod('PATCH'), adminCatalog.updateScreenSize);
router.patch('/screen-sizes/:id/toggle-status', adminCatalog.toggleScreenSizeStatus);
router.delete('/screen-sizes/:id', adminCatalog.deleteScreenSize);

export default router;
