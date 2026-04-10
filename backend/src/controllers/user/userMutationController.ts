import logger from '../../utils/logger';
import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import User, { IUser } from '../../models/User';
import Business from '../../models/Business';
import BlockedUser from '../../models/BlockedUser';
import * as userService from '../../services/UserService';
import {
  deleteFromS3Url,
  getMissingS3UploadConfigKeys,
  isPlaceholderImageUrl,
  isS3UploadConfigured
} from '../../utils/s3';
import { processSingleImage } from '../../utils/imageProcessor';
import { sendSuccessResponse } from '../../utils/respond';
import { normalizeLocation } from '../../services/location/LocationNormalizer';
import { updateUserStatus } from '../../services/UserStatusService';
import { sendErrorResponse } from '../../utils/errorResponse';
import fs from 'fs/promises';
import { AuthService } from '../../services/AuthService';
import {
  getBusinessStatus,
  getStorageSafeId,
  getUploadedFile,
  sanitizeUser,
  toSharedUser
} from './shared';

const resolveBlockerEntities = (req: Request, res: Response) => {
    if (!req.user) {
        sendErrorResponse(req, res, 401, 'Unauthorized');
        return null;
    }

    const blockerId = getStorageSafeId(req.user);
    if (!blockerId) {
        sendErrorResponse(req, res, 401, 'Invalid session');
        return null;
    }

    const blockedUserId = String(req.params.id || '').trim();
    if (!mongoose.Types.ObjectId.isValid(blockedUserId)) {
        sendErrorResponse(req, res, 400, 'Invalid user id');
        return null;
    }

    if (blockedUserId === blockerId) {
        sendErrorResponse(req, res, 400, 'You cannot block yourself');
        return null;
    }

    return { blockerId, blockedUserId };
};

export const updateMe = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendErrorResponse(req, res, 401, 'Unauthorized');
      return;
    }

    const userId = getStorageSafeId(req.user);

    if (!userId) {
      sendErrorResponse(req, res, 401, 'Invalid session');
      return;
    }

    const currentUser = await User.findById(userId).select('avatar').lean();
    const oldAvatarUrl = typeof currentUser?.avatar === 'string' ? currentUser.avatar : null;
    let oldAvatarDeleted = false;

    const updates: Partial<IUser> = { ...req.body };

    const updateRecord = updates as Record<string, unknown>;
    delete updateRecord.role;
    delete updateRecord.password;
    delete updateRecord.salt;
    delete updateRecord.mobile;

    const file = getUploadedFile(req);
    if (file) {
      if (!isS3UploadConfigured()) {
        logger.error('[Avatar Upload] Missing S3 upload configuration', {
          missingConfig: getMissingS3UploadConfigKeys(),
        });
        if (process.env.NODE_ENV !== 'development') {
            sendErrorResponse(req, res, 503, 'Image upload service is not configured on this environment.');
            return;
        }
      }

      try {
        const diskBuffer = await fs.readFile(file.path);
        const { url: s3Url } = await processSingleImage(
          diskBuffer,
          `users/${userId}/avatar`,
          file.mimetype
        );

        if (file.path) await fs.unlink(file.path).catch(err => logger.error("Disk cleanup error", err));

        if (!s3Url || isPlaceholderImageUrl(s3Url)) {
          if (process.env.NODE_ENV !== 'development') {
              sendErrorResponse(req, res, 502, 'Profile photo upload failed. Please retry.');
              return;
          }
        }

        if (oldAvatarUrl && oldAvatarUrl !== s3Url) {
          try {
            oldAvatarDeleted = await deleteFromS3Url(oldAvatarUrl);
          } catch (cleanupError) {
            logger.warn(`[Avatar Cleanup] Failed to delete old avatar for user ${userId}`, cleanupError);
          }
        }

        updates.avatar = s3Url;
      } catch (err) {
        next(err);
        return;
      }
    }

    if (updates.avatar && typeof updates.avatar === 'string' && updates.avatar.startsWith('data:image')) {
      logger.warn(`[Blocked] Base64 upload attempt: ${userId}`);
      delete updates.avatar;
    }

    if (req.body.profilePhoto && !updates.avatar) {
      if (req.body.profilePhoto.startsWith('data:image')) {
        logger.warn(`[Blocked] Base64 upload attempt: ${userId}`);
      } else {
        updates.avatar = req.body.profilePhoto;
      }
      delete (updates as Record<string, unknown>).profilePhoto;
    }

    if (
      updates.avatar &&
      typeof updates.avatar === 'string' &&
      oldAvatarUrl &&
      oldAvatarUrl !== updates.avatar &&
      !oldAvatarDeleted
    ) {
      try {
        await deleteFromS3Url(oldAvatarUrl);
      } catch (cleanupError) {
        logger.warn(`[Avatar Cleanup] Failed to delete previous avatar for user ${userId}`, cleanupError);
      }
    }

    try {
      const locationData = await normalizeLocation(req.body);
      if (locationData) {
        updates.location = {
          city: locationData.city,
          state: locationData.state,
          coordinates: locationData.coordinates
        };

      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Invalid location';
      sendErrorResponse(req, res, 400, message);
      return;
    }

    const [updated, business] = await Promise.all([
      userService.updateUser(userId, updates),
      Business.findOne({ userId }).lean()
    ]);
 
    if (!updated) {
      sendErrorResponse(req, res, 404, 'User not found');
      return;
    }
 
    const safeUpdated = sanitizeUser(updated);
    const businessStatus = getBusinessStatus(business?.status) || 'none';
    const responseData = toSharedUser(
      safeUpdated,
      businessStatus as any,
      business?._id?.toString()
    );

    sendSuccessResponse(res, responseData, 'Profile updated successfully');
    return;
  } catch (err) {
    next(err);
  }
};

export const deleteMe = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendErrorResponse(req, res, 401, 'Unauthorized');
      return;
    }

    const userId = getStorageSafeId(req.user);

    if (!userId) {
      sendErrorResponse(req, res, 401, 'Invalid session');
      return;
    }

    const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim() : '';
    const feedback = typeof req.body?.feedback === 'string' ? req.body.feedback.trim() : '';
    const combinedReason = [reason, feedback].filter(Boolean).join(': ') || undefined;

    await updateUserStatus(userId, 'deleted', {
      actor: 'USER',
      reason: combinedReason,
    });

    // Business soft-delete cascade (Ads + SmartAlerts already handled by UserStatusService)
    await Business.updateMany(
      { userId, isDeleted: { $ne: true } },
      { $set: { isDeleted: true, deletedAt: new Date() } }
    );

    AuthService.clearUserSession(res);

    res.status(204).end();
    return;
  } catch (err) {
    next(err);
  }
};

export const uploadFile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!isS3UploadConfigured()) {
      logger.error('[Upload] Missing S3 upload configuration', {
        missingConfig: getMissingS3UploadConfigKeys(),
        url: req.originalUrl,
      });
      if (process.env.NODE_ENV !== 'development') {
          sendErrorResponse(req, res, 503, 'Image upload service is not configured on this environment.');
          return;
      }
    }

    if (!req.user) {
      sendErrorResponse(req, res, 401, 'Unauthorized');
      return;
    }

    const file = getUploadedFile(req);
    if (!file) {
      logger.warn('[Upload] File upload failed: No file found in request', {
        userId: getStorageSafeId(req.user),
        method: req.method,
        url: req.originalUrl,
        contentType: req.headers['content-type']
      });
      sendErrorResponse(req, res, 400, 'No file uploaded');
      return;
    }

    const userId = getStorageSafeId(req.user);
    const requestedFolder = typeof req.body.folder === 'string' ? req.body.folder : '';
    const adId = typeof req.body.adId === 'string' ? req.body.adId.trim() : '';
    const businessId = typeof req.body.businessId === 'string' ? req.body.businessId.trim() : '';
    const serviceId = typeof req.body.serviceId === 'string' ? req.body.serviceId.trim() : '';
    const normalizedFolder = requestedFolder.trim().toLowerCase();
    const keyFolder = (() => {
      const isValidObjectId = (value: string): boolean => mongoose.Types.ObjectId.isValid(value);

      switch (normalizedFolder) {
        case '':
        case 'avatar':
        case 'avatars':
          return `users/${userId}/avatar`;
        case 'ad':
        case 'ads':
          if (!isValidObjectId(adId)) return null;
          return `ads/${adId}`;
        case 'business':
        case 'businesses':
          if (!isValidObjectId(businessId)) return null;
          return `businesses/${businessId}`;
        case 'service':
        case 'services':
          if (!isValidObjectId(serviceId)) return null;
          return `services/${serviceId}`;
        case 'document':
        case 'documents':
          return `users/${userId}/documents`;
        case 'business-staging':
        case 'staging':
          return `users/${userId}/business-staging`;
        default:
          return null;
      }
    })();
    if (!keyFolder) {
      sendErrorResponse(req, res, 400, 'Valid entity ID is required for requested upload folder');
      return;
    }
    const { url: s3Url, hash, key } = await (async () => {
      const diskBuffer = await fs.readFile(file.path);
      const result = await processSingleImage(
        diskBuffer,
        keyFolder,
        file.mimetype
      );
      if (file.path) await fs.unlink(file.path).catch(err => logger.error("Disk cleanup error", err));
      if (!result.url || isPlaceholderImageUrl(result.url)) {
        if (process.env.NODE_ENV !== 'development') {
            throw new Error('UPLOAD_PLACEHOLDER_RESULT');
        }
      }
      const urlParts = result.url.split('/');
      const fileName = urlParts[urlParts.length - 1];
      return { ...result, key: `${keyFolder}/${fileName}` };
    })();

    sendSuccessResponse(res, {
      url: s3Url,
      key: key,
      mimeType: file.mimetype,
      size: file.size
    });
    return;
  } catch (err) {
    if (err instanceof Error && err.message === 'UPLOAD_PLACEHOLDER_RESULT') {
      sendErrorResponse(req, res, 502, 'File upload failed. Please retry.');
      return;
    }
    next(err);
  }
};

export const blockUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const entities = resolveBlockerEntities(req, res);
    if (!entities) return;
    const { blockerId, blockedUserId } = entities;

    const blockedUserExists = await User.exists({
      _id: new mongoose.Types.ObjectId(blockedUserId),
      isDeleted: { $ne: true }
    });
    if (!blockedUserExists) {
      sendErrorResponse(req, res, 404, 'User not found');
      return;
    }

    await BlockedUser.updateOne(
      {
        blockerId: new mongoose.Types.ObjectId(blockerId),
        blockedId: new mongoose.Types.ObjectId(blockedUserId)
      },
      {
        $setOnInsert: {
          blockerId: new mongoose.Types.ObjectId(blockerId),
          blockedId: new mongoose.Types.ObjectId(blockedUserId)
        }
      },
      { upsert: true }
    );

    logger.info('[BlockGuard] User blocked', {
      blockerId,
      blockedUserId
    });

    sendSuccessResponse(res, { blockedUserId }, 'User blocked successfully');
    return;
  } catch (err) {
    next(err);
  }
};

export const unblockUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const entities = resolveBlockerEntities(req, res);
    if (!entities) return;
    const { blockerId, blockedUserId } = entities;

    await BlockedUser.deleteOne({
      blockerId: new mongoose.Types.ObjectId(blockerId),
      blockedId: new mongoose.Types.ObjectId(blockedUserId)
    });

    logger.info('[BlockGuard] User unblocked', {
      blockerId,
      blockedUserId
    });

    sendSuccessResponse(res, { blockedUserId }, 'User unblocked successfully');
    return;
  } catch (err) {
    next(err);
  }
};
