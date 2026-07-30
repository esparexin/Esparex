/**
 * ESPAREX — ENTITLEMENT ROUTES
 * Route definition for platform-wide entitlement queries.
 */
import { Router } from 'express';
import { protect } from '../middleware/authMiddleware';
import * as entitlementController from '../controllers/entitlements/entitlementController';

const router = Router();

router.get('/entitlements/posting', protect, entitlementController.getPostingEntitlements);

export default router;
