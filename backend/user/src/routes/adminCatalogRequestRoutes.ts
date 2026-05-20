import express from 'express';
import { requireAdmin } from '../middleware/adminAuth';
import { validateObjectId } from '../middleware/validateObjectId';
import { validateRequest } from '../middleware/validateRequest';
import { adminLimiter, adminMutationLimiter } from '../middleware/rateLimiter';
import {
    adminCatalogRequestListQuerySchema,
    adminCatalogRequestStatsQuerySchema,
    approveCatalogRequestSchema,
    rejectCatalogRequestSchema,
    markCatalogRequestDuplicateSchema,
    bulkApproveCatalogRequestSchema,
    bulkRejectCatalogRequestSchema,
    bulkMarkCatalogRequestDuplicateSchema,
} from '@esparex/core/validators/catalogRequest.validator';
import {
    getAdminCatalogRequests,
    getAdminCatalogRequestById,
    approveCatalogRequestByAdmin,
    rejectCatalogRequestByAdmin,
    markCatalogRequestDuplicateByAdmin,
    getAdminCatalogRequestStats,
    bulkApproveCatalogRequestsByAdmin,
    bulkRejectCatalogRequestsByAdmin,
    bulkMarkCatalogRequestsDuplicateByAdmin,
} from '../controllers/catalogRequestController';

const router = express.Router();

router.use(requireAdmin);
router.use(adminLimiter);
router.use((req, res, next) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method.toUpperCase())) {
        return adminMutationLimiter(req, res, next);
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
    bulkMarkCatalogRequestsDuplicateByAdmin
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
    markCatalogRequestDuplicateByAdmin
);

export default router;
