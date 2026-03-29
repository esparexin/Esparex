import express from 'express';

import { protect } from '../middleware/authMiddleware';
import * as notificationController from '../controllers/notification';
import { validateObjectId } from '../middleware/validateObjectId';
import { mutationLimiter } from '../middleware/rateLimiter';
import { validateRequest } from '../middleware/validateRequest';
import { registerFcmTokenSchema } from '../validators/user.validator';
import { userNotificationsQuerySchema } from '../validators/notificationValidators';

const router = express.Router();

// Register Token for Push Notifications (with rate limiting)
router.post('/register', protect, mutationLimiter, validateRequest(registerFcmTokenSchema), notificationController.registerToken);

// Get Notifications
router.get('/', protect, validateRequest({ query: userNotificationsQuerySchema }), notificationController.getNotifications);

// Mark ALL Notifications as Read — must be BEFORE /:id/read so 'all' isn't treated as an ObjectId
router.put('/all/read', protect, notificationController.markAllRead);

// Mark Single Notification as Read
router.put('/:id/read', protect, validateObjectId, notificationController.markRead);

// Delete Notification
router.delete('/:id', protect, validateObjectId, notificationController.deleteNotification);

export default router;
