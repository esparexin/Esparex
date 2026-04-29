import { Router } from 'express';
import { protect, authorize } from '../middleware/authMiddleware';
import {
    getOverview,
    getAdminPerformance,
    getSystemHealth,
    getAnomalies
} from '../controllers/admin/analyticsController';

const router = Router();

// Apply auth middleware to all analytics routes
// Ensure only super_admin or admin roles can access
router.use(protect);
router.use(authorize('super_admin', 'admin'));

router.get('/overview', getOverview);
router.get('/admin-performance', getAdminPerformance);
router.get('/system-health', getSystemHealth);
router.get('/anomalies', getAnomalies);

export default router;
