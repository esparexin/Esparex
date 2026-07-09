import Business from '../../models/Business';
import Ad from '../../models/Ad';
import { GOVERNANCE, MS_IN_DAY } from '../../config/constants';
import { publishedBusinessStatusQuery } from '../../utils/businessStatus';
import { BUSINESS_STATUS, LISTING_STATUS, LISTING_TYPE, ACTOR_TYPE } from '@esparex/shared';
import type { ActorMetadata } from '@esparex/shared';
import { mutateStatuses, mutateStatus } from '../lifecycle/StatusMutationService';
import { AppError } from '../../utils/AppError';
import * as businessLifecycleService from '../business/BusinessLifecycleService';

export const getBusinessOverview = async () => {
    const thirty = new Date(Date.now() + GOVERNANCE.BUSINESS.AUTO_EXPIRE_CHECK_DAYS * MS_IN_DAY);
    const seven = new Date(); seven.setDate(seven.getDate() - 7);
    const [live, pending, suspended, rejected, deleted, total, expiringSoon, expiringIn3Days, timeline, topCities] = await Promise.all([
        Business.countDocuments({ status: BUSINESS_STATUS.LIVE }),
        Business.countDocuments({ status: BUSINESS_STATUS.PENDING }),
        Business.countDocuments({ status: BUSINESS_STATUS.SUSPENDED }),
        Business.countDocuments({ status: BUSINESS_STATUS.REJECTED }),
        Business.countDocuments({ isDeleted: true }).setOptions({ withDeleted: true }),
        Business.countDocuments({}).setOptions({ withDeleted: true }),
        Business.countDocuments({ status: publishedBusinessStatusQuery, expiresAt: { $lte: thirty, $gte: new Date() }, isDeleted: false }),
        Business.countDocuments({ status: publishedBusinessStatusQuery, expiresAt: { $lte: new Date(Date.now() + 3 * MS_IN_DAY), $gte: new Date() }, isDeleted: false }),
        Business.aggregate([{ $match: { createdAt: { $gte: seven }, isDeleted: { $ne: true } } }, { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
        Business.aggregate([{ $match: { isDeleted: { $ne: true }, 'location.city': { $exists: true, $ne: '' } } }, { $group: { _id: '$location.city', count: { $sum: 1 } } }, { $sort: { count: -1, _id: 1 } }, { $limit: 5 }, { $project: { _id: 0, city: '$_id', count: 1 } }]),
    ]);
    return { total, pending, live, suspended, rejected, deleted, expiringSoon, expiringIn3Days, analytics: { timeline, topCities } };
};

export const getAdminBusinessById = async (id: string) => Business.findOne({ _id: id }).setOptions({ withDeleted: true }).populate('userId');
export const findBusinessForAdmin = async (id: string) => Business.findById(id);

export const cascadeExpireBusinessListings = async (businessId: unknown, actor: { type?: string; id?: string }, reason: string) => {
    const nid = typeof businessId === 'string' && businessId.trim() ? businessId.trim() : businessId?.toString?.();
    if (!nid) return 0;
    const na: ActorMetadata = { type: (actor.type === ACTOR_TYPE.ADMIN || actor.type === ACTOR_TYPE.SYSTEM) ? actor.type : ACTOR_TYPE.USER, id: actor.id };
    const listings = await Ad.find({ businessId: nid, status: { $ne: LISTING_STATUS.EXPIRED } }).select('_id listingType');
    if (listings.length > 0) await mutateStatuses(listings.map((l) => ({ domain: l.listingType === LISTING_TYPE.SERVICE ? LISTING_TYPE.SERVICE : l.listingType === LISTING_TYPE.SPARE_PART ? 'spare_part_listing' : LISTING_TYPE.AD, entityId: l._id.toString(), toStatus: LISTING_STATUS.EXPIRED, actor: na, reason })));
    return listings.length;
};

export const approveAdminBusiness = async (id: string, actorId: string, logFn: any) => {
    const business = await businessLifecycleService.approveBusiness(id, actorId) as any;
    if (!business) throw new AppError('Business not found', 404);
    await logFn('APPROVE_BUSINESS', 'Business', id, { expiresAt: business.expiresAt });
    const { dispatchTemplatedNotification } = await import('../NotificationService');
    const { recalculateTrustScore } = await import('../TrustService');
    await dispatchTemplatedNotification(business.userId.toString(), 'BUSINESS_STATUS', 'BUSINESS_APPROVED', { name: business.name }, { businessId: business._id.toString(), status: BUSINESS_STATUS.LIVE });
    setImmediate(() => void recalculateTrustScore(business.userId).catch(() => {}));
    return business;
};

export const rejectAdminBusiness = async (id: string, reason: string, actorId: string, logFn: any) => {
    if (!reason) throw new AppError('Rejection reason is required', 400);
    const business = await businessLifecycleService.rejectBusiness(id, reason, actorId) as any;
    if (!business) throw new AppError('Business not found', 404);
    await logFn('REJECT_BUSINESS', 'Business', id, { reason });
    const { dispatchTemplatedNotification } = await import('../NotificationService');
    await dispatchTemplatedNotification(business.userId.toString(), 'BUSINESS_STATUS', 'BUSINESS_REJECTED', { name: business.name, reason }, { businessId: business._id.toString(), status: BUSINESS_STATUS.REJECTED });
    await cascadeExpireBusinessListings(business._id, { type: ACTOR_TYPE.ADMIN, id: actorId }, `Cascaded from business rejection: ${reason}`);
    return business;
};

export const expireAdminBusiness = async (id: string, actorId: string, logFn: any) => {
    const business = await Business.findById(id);
    if (!business) throw new AppError('Business not found', 404);
    const actor: ActorMetadata = { type: ACTOR_TYPE.ADMIN, id: actorId };
    await mutateStatus({ domain: 'business', entityId: id, toStatus: BUSINESS_STATUS.EXPIRED, actor, reason: 'Manual expiry by admin' });
    const count = await cascadeExpireBusinessListings(business._id, actor, 'Cascaded from admin manual expiry');
    await logFn('EXPIRE_BUSINESS', 'Business', id, { cascadedListings: count });
    const { dispatchTemplatedNotification } = await import('../NotificationService');
    await dispatchTemplatedNotification(business.userId.toString(), 'BUSINESS_STATUS', 'BUSINESS_EXPIRED', { name: business.name }, { businessId: id, status: BUSINESS_STATUS.EXPIRED });
    return Business.findById(id).lean();
};
