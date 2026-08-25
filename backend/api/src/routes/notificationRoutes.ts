import express from 'express';

import { protect } from '../middleware/authMiddleware';
import * as notificationController from '../controllers/notification';
import { validateObjectId } from '../middleware/validateObjectId';
import { mutationLimiter } from '../middleware/rateLimiter';
import { validateRequest } from '../middleware/validateRequest';
import { registerFcmTokenSchema } from '@esparex/core/validators/user.validator';
import { userNotificationsQuerySchema } from '../middleware/notificationValidators';
import { deprecateMethod } from '../middleware/deprecations';

const router = express.Router();

// Register Token for Push Notifications (with rate limiting)
router.post('/register', mutationLimiter, protect, validateRequest(registerFcmTokenSchema), notificationController.registerToken);

// Get Notifications
router.get('/', protect, validateRequest({ query: userNotificationsQuerySchema }), notificationController.getNotifications);

// Mark ALL Notifications as Read (Standardized)
router.patch('/all/read', mutationLimiter, protect, notificationController.markAllRead);

// DEPRECATED: Mark ALL Notifications as Read — must be BEFORE /:id/read so 'all' isn't treated as an ObjectId
router.put('/all/read', mutationLimiter, deprecateMethod('PATCH'), protect, notificationController.markAllRead);

// Mark Single Notification as Read (Standardized)
router.patch('/:id/read', mutationLimiter, protect, validateObjectId, notificationController.markRead);

// DEPRECATED: Mark Single Notification as Read
router.put('/:id/read', mutationLimiter, deprecateMethod('PATCH'), protect, validateObjectId, notificationController.markRead);

// Delete Notification
router.delete('/:id', mutationLimiter, protect, validateObjectId, notificationController.deleteNotification);

export default router;
