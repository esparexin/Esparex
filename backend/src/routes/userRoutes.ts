import express from 'express';
import * as userController from '../controllers/user';
import * as savedAdController from '../controllers/savedAd';
import { protect } from '../middleware/authMiddleware';
import { mutationLimiter, searchLimiter } from '../middleware/rateLimiter';
import { validateObjectId } from '../middleware/validateObjectId';

const router = express.Router();



// --- Profile Routes ---
/**
 * @swagger
 * /users/me:
 *   get:
 *     summary: Get current user profile
 *     description: Retrieve the profile of the currently authenticated user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     mobile:
 *                       type: string
 *                     role:
 *                       type: string
 *                       enum: [user, admin, business]
 *                     businessId:
 *                       type: string
 *                     businessStatus:
 *                       type: string
 *                       enum: [NONE, PENDING, APPROVED, REJECTED]
 */
import multer from 'multer';
import os from 'os';
import { createUploadMiddleware } from '../utils/uploadFactory';

// Allowed image MIME types for user profile / file uploads
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'];

// Image-only upload config for user profile (SSOT)
const upload = createUploadMiddleware({
    allowedMimeTypes: ALLOWED_IMAGE_TYPES,
    maxFileSize: 5 * 1024 * 1024, // 5MB
    errorLabel: 'image type'
});

import * as walletController from '../controllers/wallet';

import * as boostController from '../controllers/boost';

import { validateRequest } from '../middleware/validateRequest';
import { updateUserProfileSchema } from '../validators/user.validator';

router.get('/me', protect, userController.getMe);
router.get('/:id/reputation', validateObjectId, searchLimiter, userController.getUserReputationById);
router.get('/:id/profile', validateObjectId, searchLimiter, userController.getUserProfileById);
router.post('/:id/block', protect, validateObjectId, mutationLimiter, userController.blockUser);
router.delete('/:id/block', protect, validateObjectId, mutationLimiter, userController.unblockUser);
router.get('/me/wallet', protect, walletController.getWalletSummary);
router.get('/me/posting-balance', protect, walletController.getPostingBalance);
router.get('/me/transactions', protect, walletController.getTransactionHistory);
router.get('/me/boosts', protect, boostController.getMyBoosts);
router.patch('/me', protect, upload.single('profilePhoto'), validateRequest(updateUserProfileSchema), userController.updateMe);
import logger from '../utils/logger';

router.post(
    '/upload',
    (req, res) => {
        return res.status(410).json({
            success: false,
            error: "Endpoint removed. Use PATCH /api/v1/users/me",
            status: 410
        });
    }
);
router.delete('/me', protect, userController.deleteMe);

import { saveAdSchema, savedAdParamSchema, getSavedAdsQuerySchema } from '../validators/savedAd.validator';

// --- Saved Ads ---
router.post('/saved-ads', protect, mutationLimiter, validateRequest(saveAdSchema), savedAdController.saveAd);
router.delete('/saved-ads/:adId', protect, mutationLimiter, validateRequest({ params: savedAdParamSchema }), savedAdController.unsaveAd);
router.get('/saved-ads', protect, validateRequest({ query: getSavedAdsQuerySchema }), savedAdController.getSavedAds);

export default router;
