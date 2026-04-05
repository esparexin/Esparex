import { Router } from "express";
import { adminOnly } from "../../middleware/authMiddleware";
import { adminListConversations } from "../../controllers/admin/messages/listConversations";
import { adminGetChat } from "../../controllers/admin/messages/getChat";
import { adminFlagChat } from "../../controllers/admin/messages/flagChat";
import { adminBulkLimiter } from '../../middleware/rateLimiter';

const router = Router();

// Ensure all routes require admin permissions
// Note: 'protect' middleware should be applied before mounting this router in index.ts
router.use(adminOnly);

router.get("/", adminBulkLimiter, adminListConversations);
router.get("/chat", adminBulkLimiter, adminGetChat);
router.post("/flag", adminBulkLimiter, adminFlagChat);

export default router;
