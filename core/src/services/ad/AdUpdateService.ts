import { AppError } from '../../utils/AppError';
import logger from '../../utils/logger';
import { getListingRepository, getListingUnitOfWork } from '../../composition/listings';
import { type Listing } from '../../domains/listings';
import { isValidObjectId } from '../../utils/idUtils';


import { LISTING_STATUS } from '@esparex/shared';
import { LIFECYCLE_STATUS } from '@esparex/shared';
import { NOTIFICATION_TYPE } from '@esparex/shared';
import { AdContext } from '../../types/ad.types';
import { generateUniqueSlugWithChecker } from '../../utils/slugGenerator';
import { AdCreationService } from '../AdCreationService';
import { mutateStatus } from '../lifecycle/StatusMutationService';
import { enqueueImageOptimization } from '../../queues/imageQueue';

export const updateAdLogic = async (
    adId: string,
    data: unknown,
    context: AdContext,
    externalSession?: unknown
): Promise<Record<string, unknown> | null> => {
    if (!isValidObjectId(adId)) return null;

    try {
        let updatedAd: Listing | null = null;
        let oldPriceValue: number | undefined;
        let removedImagesCache: string[] = [];
        
        const executeUpdate = async (session: unknown) => {
            const ad = await getListingRepository().findOne({ ids: [adId], session });
            if (!ad) return;

            oldPriceValue = ad.price;

            if (context.actor === 'USER' && ad.sellerId !== context.sellerId)
                throw new AppError('Unauthorized: You can only edit your own ads', 403);
            if (ad.status === LIFECYCLE_STATUS.SOLD || ad.status === LIFECYCLE_STATUS.EXPIRED || ad.status === LIFECYCLE_STATUS.REJECTED || ad.status === LIFECYCLE_STATUS.DEACTIVATED)
                throw new AppError('This ad can no longer be edited in its current status.', 400);

            if (context.actor === 'USER' && ad.status === LISTING_STATUS.PENDING)
                throw new AppError('Pending listings are view-only and cannot be edited', 400);

            if (context.actor === 'USER' && !context.allowSuspendedUser) {
                const User = (await import('@esparex/core/models/User')).default;
                const user = await User.findById(context.authUserId).select('isSuspended').lean();
                if ((user as { isSuspended?: boolean } | null)?.isSuspended)
                    throw Object.assign(new Error('Account suspended'), { statusCode: 403, code: 'ACCOUNT_SUSPENDED' });
            }

            const payload = await AdCreationService.preparePayload(
                {
                    listingType: ad.listingType,
                    categoryId: ad.categoryId?.toString(),
                    ...(data as Record<string, unknown>),
                },
                context,
                true,
                ad.categoryId?.toString(),
                adId
            );

            const untypedPayload = payload as Record<string, unknown>;
            const untypedAd = ad as unknown as Record<string, unknown>;

            let sensitiveChange = false;
            if (context.actor === 'USER') {
                if (untypedPayload.title && untypedPayload.title !== untypedAd.title) sensitiveChange = true;
                if (untypedPayload.description && untypedPayload.description !== untypedAd.description) sensitiveChange = true;
                if (untypedPayload.price !== undefined && untypedPayload.price !== untypedAd.price) sensitiveChange = true;
                if (Array.isArray(untypedPayload.images)) {
                    const newImages = untypedPayload.images.join(',');
                    const oldImages = (Array.isArray(untypedAd.images) ? untypedAd.images : []).join(',');
                    if (newImages !== oldImages) sensitiveChange = true;
                }
            }

            const requiresReviewTransition = context.actor === 'USER' && 
                ((ad.status === LISTING_STATUS.LIVE && sensitiveChange) || (ad.status as string) === 'rejected');

            const oldImagesList = Array.isArray(untypedAd.images) ? untypedAd.images as string[] : [];
            const newImagesList = Array.isArray(untypedPayload.images) ? untypedPayload.images as string[] : oldImagesList;
            removedImagesCache = oldImagesList.filter(img => !newImagesList.includes(img));

            if (context.actor === 'USER') {
                untypedPayload.$inc = { ...(untypedPayload.$inc as Record<string, number>), reviewVersion: 1 };
            }

            // Status transitions must not be embedded in direct update queries.
            delete untypedPayload.status;

            let slugRetries = 0;
            while (slugRetries < 3) {
                try {
                    const updated = await getListingRepository().updateOne(adId, payload as any, session);
                    updatedAd = updated;
                    break;
                } catch (error: unknown) {
                    const mongoError = error as { code?: number; keyPattern?: { seoSlug?: string } };
                    if (mongoError.code === 11000 && mongoError.keyPattern?.seoSlug) {
                        slugRetries++;
                        const baseTitle = (payload as Record<string, unknown>).title as string || ad.title;
                        (payload as Record<string, unknown>).seoSlug = await generateUniqueSlugWithChecker(
                            baseTitle,
                            async (candidate) => {
                                const count = await getListingRepository().count({ seoSlug: candidate, idsNotIn: [adId], session });
                                return count > 0;
                            },
                            ad.seoSlug
                        );
                    } else {
                        throw error;
                    }
                }
            }

            if (updatedAd && requiresReviewTransition) {
                updatedAd = (await mutateStatus({
                    domain: ad.listingType === 'service' ? 'service' : 'ad',
                    entityId: adId,
                    toStatus: LISTING_STATUS.PENDING,
                    actor: {
                        type: context.actor === 'ADMIN' ? 'admin' : 'user',
                        id: context.authUserId,
                    },
                    reason: 'Re-submitted for review after edit',
                    metadata: {
                        action: 'listing_edit',
                        sourceRoute: '/api/v1/ads/:id',
                    },
                    patch: {
                        moderationStatus: 'held_for_review',
                        $push: {
                            timeline: {
                                status: LISTING_STATUS.PENDING,
                                timestamp: new Date(),
                                reason: 'Re-submitted for review after edit',
                            },
                        },
                    },
                    session,
                })) as unknown as Listing | null;
            }
        };

        if (externalSession) {
            await executeUpdate(externalSession);
        } else {
            await getListingUnitOfWork().executeTransaction(async (session) => {
                await executeUpdate(session);
            });
        }

        if (!updatedAd) return null;
        
        const updatedAdTyped = updatedAd as Listing;
        if (Array.isArray(updatedAdTyped.images) && updatedAdTyped.images.length > 0) {
            enqueueImageOptimization(adId, 'ad', updatedAdTyped.images).catch(err => {
                logger.error('Failed to enqueue image optimization after Ad edit', err);
            });
        }

        // 💰 PRICE DROP ENGINE
        if (oldPriceValue && updatedAdTyped.price < oldPriceValue) {
            void (async () => {
                try {
                    const SavedAd = (await import('@esparex/core/models/SavedAd')).default;
                    const keepers = await SavedAd.find({ adId }).select('userId').lean();
                    if (keepers.length > 0) {
                        const { dispatchTemplatedNotification } = await import('../NotificationService');
                        for (const keeper of keepers) {
                            await dispatchTemplatedNotification(
                                String(keeper.userId),
                                NOTIFICATION_TYPE.PRICE_DROP,
                                'PRICE_DROP',
                                { 
                                    adTitle: updatedAdTyped.title, 
                                    price: String(updatedAdTyped.price) 
                                },
                                { adId, type: 'price_drop' }
                             );
                        }
                    }
                } catch (err) {
                    logger.error('Failed to dispatch price drop notifications', { error: err, adId });
                }
            })();
        }

        if (removedImagesCache.length > 0) {
            void (async () => {
                try {
                    const { deleteFromS3Url } = await import('../../utils/s3');
                    for (const url of removedImagesCache) {
                        await deleteFromS3Url(url).catch(e => logger.error(`Failed to delete orphaned image: ${url}`, e));
                    }
                } catch (err) {
                    logger.error('Failed to execute orphan image cleanup task', err);
                }
            })();
        }

        if (typeof (updatedAd as any).toObject === 'function') {
            return (updatedAd as any).toObject();
        }
        return updatedAd as unknown as Record<string, unknown>;
    } catch (error) {
        logger.error('Failed to update ad', {
            error: error instanceof Error ? error.message : String(error),
            adId
        });
        throw error;
    }
};


