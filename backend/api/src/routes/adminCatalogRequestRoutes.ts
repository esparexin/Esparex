import express from 'express';
import { requireAdmin, requireMutationPermission } from '../middleware/adminAuth';
import { validateObjectId } from '../middleware/validateObjectId';
import { validateRequest } from '../middleware/validateRequest';
import { adminLimiter } from '../middleware/rateLimiter';
import {
    adminCatalogRequestListQuerySchema,
    adminCatalogRequestStatsQuerySchema,
    approveCatalogRequestSchema,
    rejectCatalogRequestSchema,
    markCatalogRequestDuplicateSchema,
    bulkApproveCatalogRequestSchema,
    bulkRejectCatalogRequestSchema,
    bulkMarkCatalogRequestDuplicateSchema,
    bulkDeleteCatalogRequestSchema,
} from '@esparex/core/validators/catalogRequest.validator';
import {
    getAdminCatalogRequests,
    getAdminCatalogRequestById,
    approveCatalogRequestByAdmin,
    rejectCatalogRequestByAdmin,
    markCatalogRequestMergedByAdmin,
    getAdminCatalogRequestStats,
    bulkApproveCatalogRequestsByAdmin,
    bulkRejectCatalogRequestsByAdmin,
    bulkMarkCatalogRequestsMergedByAdmin,
    deleteCatalogRequestByAdmin,
    bulkDeleteCatalogRequestsByAdmin,
} from '../controllers/catalogRequestController';

const router = express.Router();

router.use(requireAdmin);
router.use(adminLimiter);
router.use(requireMutationPermission('catalog:write'));

router.get('/stats', validateRequest({ query: adminCatalogRequestStatsQuerySchema }), getAdminCatalogRequestStats);
router.get('/', validateRequest({ query: adminCatalogRequestListQuerySchema }), getAdminCatalogRequests);

// Bulk Operations
router.post(
    '/bulk/approve',
    validateRequest(bulkApproveCatalogRequestSchema),
    bulkApproveCatalogRequestsByAdmin
);
router.post(
    '/bulk/reject',
    validateRequest(bulkRejectCatalogRequestSchema),
    bulkRejectCatalogRequestsByAdmin
);
router.post(
    '/bulk/mark-duplicate',
    validateRequest(bulkMarkCatalogRequestDuplicateSchema),
    bulkMarkCatalogRequestsMergedByAdmin
);
router.post(
    '/bulk/delete',
    validateRequest(bulkDeleteCatalogRequestSchema),
    bulkDeleteCatalogRequestsByAdmin
);

router.get('/:id', validateObjectId, getAdminCatalogRequestById);
router.delete('/:id', validateObjectId, deleteCatalogRequestByAdmin);
router.post(
    '/:id/approve',
    validateObjectId,
    validateRequest(approveCatalogRequestSchema),
    approveCatalogRequestByAdmin
);
router.post(
    '/:id/reject',
    validateObjectId,
    validateRequest(rejectCatalogRequestSchema),
    rejectCatalogRequestByAdmin
);
router.post(
    '/:id/mark-duplicate',
    validateObjectId,
    validateRequest(markCatalogRequestDuplicateSchema),
    markCatalogRequestMergedByAdmin
);

export default router;
