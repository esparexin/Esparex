import express from 'express';
import { requireAdmin, requirePermission } from '../middleware/adminAuth';
import { validateObjectId } from '../middleware/validateObjectId';
import { validateRequest } from '../middleware/validateRequest';
import { adminLimiter, adminMutationLimiter } from '../middleware/rateLimiter';
import { adminCatalogRequestListQuerySchema, adminCatalogRequestStatsQuerySchema, approveCatalogRequestSchema, rejectCatalogRequestSchema, markCatalogRequestDuplicateSchema, bulkApproveCatalogRequestSchema, bulkRejectCatalogRequestSchema, bulkMarkCatalogRequestDuplicateSchema,  } from '@esparex/core/validators';;
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
} from '../controllers/catalogRequestController';

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

router.get('/:id', validateObjectId, getAdminCatalogRequestById);
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
