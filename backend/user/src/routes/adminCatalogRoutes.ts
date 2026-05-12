import express from 'express';
import { requireAdmin } from '../middleware/adminAuth';
import * as adminCatalog from '@esparex/core/controllers/admin/catalog';

const router = express.Router();

router.use(requireAdmin);

router.get('/categories', adminCatalog.getCategories);
router.get('/categories/counts', adminCatalog.getCategoryCounts);
router.get('/categories/:id', adminCatalog.getCategoryById);
router.get('/categories/:id/schema', adminCatalog.getCategorySchema);
router.patch('/categories/:id/status', adminCatalog.toggleCategoryStatus);

router.get('/governance/hierarchy-tree', adminCatalog.getHierarchyTree);
router.get('/governance/metrics', adminCatalog.getGovernanceMetrics);
router.get('/governance/logs', adminCatalog.getGovernanceLogs);

router.get('/ai-analysis', adminCatalog.getAiAnalysisQueue);
router.post('/ai-analysis/analyze-brand', adminCatalog.analyzeBrandSuggestion);
router.post('/ai-analysis/analyze-model', adminCatalog.analyzeModelSuggestion);

router.get('/brands', adminCatalog.getBrands);
router.get('/brands/:id', adminCatalog.getBrandById);
router.post('/brands', adminCatalog.createBrand);
router.put('/brands/:id', adminCatalog.updateBrand);
router.patch('/brands/:id', adminCatalog.updateBrand);
router.patch('/brands/:id/status', adminCatalog.toggleBrandStatus);
router.delete('/brands/:id', adminCatalog.deleteBrand);
router.patch('/brands/:id/approve', adminCatalog.approveBrand);
router.patch('/brands/:id/reject', adminCatalog.rejectBrand);

router.get('/models', adminCatalog.getModels);
router.get('/models/:id', adminCatalog.getModelById);
router.post('/models', adminCatalog.createModel);
router.put('/models/:id', adminCatalog.updateModel);
router.patch('/models/:id', adminCatalog.updateModel);
router.patch('/models/:id/status', adminCatalog.toggleModelStatus);
router.delete('/models/:id', adminCatalog.deleteModel);
router.post('/models/ensure', adminCatalog.ensureModel);
router.patch('/models/:id/approve', adminCatalog.approveModel);
router.patch('/models/:id/reject', adminCatalog.rejectModel);

router.get('/spare-parts', adminCatalog.getSpareParts);
router.get('/spare-parts/:id', adminCatalog.getSparePartById);
router.post('/spare-parts', adminCatalog.createSparePart);
router.put('/spare-parts/:id', adminCatalog.updateSparePart);
router.patch('/spare-parts/:id', adminCatalog.updateSparePart);
router.patch('/spare-parts/:id/toggle-status', adminCatalog.toggleSparePartStatus);
router.patch('/spare-parts/:id/status', adminCatalog.toggleSparePartStatus);
router.delete('/spare-parts/:id', adminCatalog.deleteSparePart);

router.get('/service-types', adminCatalog.getServiceTypes);
router.get('/service-types/:id', adminCatalog.getServiceTypeById);
router.post('/service-types', adminCatalog.createServiceType);
router.put('/service-types/:id', adminCatalog.updateServiceType);
router.patch('/service-types/:id', adminCatalog.updateServiceType);
router.patch('/service-types/:id/toggle-status', adminCatalog.toggleServiceTypeStatus);
router.patch('/service-types/:id/status', adminCatalog.toggleServiceTypeStatus);
router.delete('/service-types/:id', adminCatalog.deleteServiceType);

router.get('/screen-sizes', adminCatalog.getScreenSizes);
router.get('/screen-sizes/:id', adminCatalog.getScreenSizeById);
router.post('/screen-sizes', adminCatalog.createScreenSize);
router.put('/screen-sizes/:id', adminCatalog.updateScreenSize);
router.patch('/screen-sizes/:id', adminCatalog.updateScreenSize);
router.patch('/screen-sizes/:id/toggle-status', adminCatalog.toggleScreenSizeStatus);
router.patch('/screen-sizes/:id/status', adminCatalog.toggleScreenSizeStatus);
router.delete('/screen-sizes/:id', adminCatalog.deleteScreenSize);

export default router;
