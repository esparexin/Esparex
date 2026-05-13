import express from 'express';
import { requireAdmin } from '../middleware/adminAuth';
import { validateObjectId } from '../middleware/validateObjectId';
import { validateRequest } from '../middleware/validateRequest';
import {
    adminCatalogRequestListQuerySchema,
    adminCatalogRequestStatsQuerySchema,
    approveCatalogRequestSchema,
    rejectCatalogRequestSchema,
    markCatalogRequestDuplicateSchema,
} from '@esparex/core/validators/catalogRequest.validator';
import {
    getAdminCatalogRequests,
    getAdminCatalogRequestById,
    approveCatalogRequestByAdmin,
    rejectCatalogRequestByAdmin,
    markCatalogRequestDuplicateByAdmin,
    getAdminCatalogRequestStats,
} from '../controllers/catalogRequestController';

const router = express.Router();

router.use(requireAdmin);

router.get('/stats', validateRequest({ query: adminCatalogRequestStatsQuerySchema }), getAdminCatalogRequestStats);
router.get('/', validateRequest({ query: adminCatalogRequestListQuerySchema }), getAdminCatalogRequests);
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
