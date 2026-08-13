import type { AdminLogFn } from '../../utils/adminLogger';
import Business from '../../models/Business';
import Ad from '../../models/Ad';
import { GOVERNANCE, MS_IN_DAY } from '../../config/constants';
import { publishedBusinessStatusQuery } from '../../utils/businessStatus';
import { BUSINESS_STATUS, LISTING_STATUS, LISTING_TYPE, ACTOR_TYPE } from '@esparex/contracts';
import type { ActorMetadata } from '@esparex/contracts';
import { mutateStatuses, mutateStatus } from '../lifecycle/StatusMutationService';
import { AppError } from '../../utils/AppError';
import * as businessLifecycleService from '../business/BusinessLifecycleService';
import logger from '../../utils/logger';

import { getAdminBusinessAccountsData, transformBusinessDocs } from './helpers';

export const getBusinessOverview = async () => {
    const now = new Date();
    const thirtyDaysFromNow = new Date(Date.now() + GOVERNANCE.BUSINESS.AUTO_EXPIRE_CHECK_DAYS * MS_IN_DAY);
    const threeDaysFromNow = new Date(Date.now() + 3 * MS_IN_DAY);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [facetResults, timeline, topCities] = await Promise.all([
        Business.aggregate([
            {
                $facet: {
                    total: [{ $match: { isDeleted: { $ne: true } } }, { $count: 'count' }],
                    live: [{ $match: { status: BUSINESS_STATUS.LIVE, isDeleted: { $ne: true } } }, { $count: 'count' }],
                    pending: [{ $match: { status: BUSINESS_STATUS.PENDING, isDeleted: { $ne: true } } }, { $count: 'count' }],
                    suspended: [{ $match: { status: BUSINESS_STATUS.SUSPENDED, isDeleted: { $ne: true } } }, { $count: 'count' }],
                    rejected: [{ $match: { status: BUSINESS_STATUS.REJECTED, isDeleted: { $ne: true } } }, { $count: 'count' }],
                    deleted: [{ $match: { isDeleted: true } }, { $count: 'count' }],
                    expiringSoon: [
                        {
                            $match: {
                                status: publishedBusinessStatusQuery,
                                expiresAt: { $lte: thirtyDaysFromNow, $gte: now },
                                isDeleted: { $ne: true }
                            }
                        },
                        { $count: 'count' }
                    ],
                    expiringIn3Days: [
                        {
                            $match: {
                                status: publishedBusinessStatusQuery,
                                expiresAt: { $lte: threeDaysFromNow, $gte: now },
                                isDeleted: { $ne: true }
                            }
                        },
                        { $count: 'count' }
                    ]
                }
            }
        ]),
        Business.aggregate([
            { $match: { createdAt: { $gte: sevenDaysAgo }, isDeleted: { $ne: true } } },
            { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]),
        Business.aggregate([
            { $match: { isDeleted: { $ne: true }, 'location.city': { $exists: true, $ne: '' } } },
            { $group: { _id: '$location.city', count: { $sum: 1 } } },
            { $sort: { count: -1, _id: 1 } },
            { $limit: 5 },
            { $project: { _id: 0, city: '$_id', count: 1 } }
        ])
    ]);

    const res = facetResults[0] || {};
    const extractCount = (arr?: Array<{ count: number }>) => arr?.[0]?.count ?? 0;

    return {
        total: extractCount(res.total),
        pending: extractCount(res.pending),
        live: extractCount(res.live),
        suspended: extractCount(res.suspended),
        rejected: extractCount(res.rejected),
        deleted: extractCount(res.deleted),
        expiringSoon: extractCount(res.expiringSoon),
        expiringIn3Days: extractCount(res.expiringIn3Days),
        analytics: { timeline, topCities }
    };
};

export const getAdminBusinessAccounts = async (params: {
    status?: string;
    locationId?: string;
    search?: string;
    expiringIn3Days?: string;
    warningSent?: string;
    warningNotSent?: string;
    skip: number;
    limit: number;
    includeDeleted?: string;
}) => {
    const { adminQuery } = await getAdminBusinessAccountsData(params);

    if (params.search) {
        const { escapeRegExp } = require('../../utils/stringUtils');
        const safeSearch = escapeRegExp(params.search);
        adminQuery.$or = [
            { name: { $regex: safeSearch, $options: 'i' } },
            { email: { $regex: safeSearch, $options: 'i' } },
            { mobile: { $regex: safeSearch, $options: 'i' } },
            { 'location.city': { $regex: safeSearch, $options: 'i' } },
        ];
    }

    const shouldIncludeDeleted = params.status === BUSINESS_STATUS.DELETED || params.status === 'all' || params.includeDeleted === 'true';

    const [rawItems, total] = await Promise.all([
        Business.find(adminQuery)
            .skip(params.skip)
            .limit(params.limit)
            .sort({ createdAt: -1 })
            .populate('userId')
            .setOptions(shouldIncludeDeleted ? { withDeleted: true } : {}),
        Business.countDocuments(adminQuery)
            .setOptions(shouldIncludeDeleted ? { withDeleted: true } : {}),
    ]);

    const items = transformBusinessDocs(rawItems);
    return { items, total };
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

export const approveAdminBusiness = async (id: string, actorId: string, logFn: AdminLogFn) => {
    const business = await businessLifecycleService.approveBusiness(id, actorId);
    if (!business) throw new AppError('Business not found', 404);
    await logFn('APPROVE_BUSINESS', 'Business', id, { expiresAt: business.expiresAt });
    const { dispatchTemplatedNotification } = await import('../../domains/notifications/application/NotificationService');
    const { recalculateTrustScore } = await import('../TrustService');
    const { assignDefaultPlan } = await import('../business/BusinessSubscriptionService');

    const userIdStr = String(business.userId ?? '');
    const businessIdStr = String(business._id ?? '');
    await dispatchTemplatedNotification(userIdStr, 'BUSINESS_STATUS', 'BUSINESS_APPROVED', { name: String(business.name ?? '') }, { businessId: businessIdStr, status: String(BUSINESS_STATUS.LIVE) });
    
    // Assign default business plan dynamically (wrapped so errors don't block approval)
    try {
        await assignDefaultPlan(userIdStr);
    } catch (planErr) {
        logger.error('Failed to assign default business plan on approval', {
            businessId: id,
            userId: business.userId,
            error: planErr instanceof Error ? planErr.message : String(planErr)
        });
    }

    setImmediate(() => void recalculateTrustScore(userIdStr).catch(() => {}));
    return business;
};


export const rejectAdminBusiness = async (id: string, reason: string, actorId: string, logFn: AdminLogFn) => {
    if (!reason) throw new AppError('Rejection reason is required', 400);
    const business = await businessLifecycleService.rejectBusiness(id, reason, actorId);
    if (!business) throw new AppError('Business not found', 404);
    await logFn('REJECT_BUSINESS', 'Business', id, { reason });
    const { dispatchTemplatedNotification } = await import('../../domains/notifications/application/NotificationService');
    const userIdStr = String(business.userId ?? '');
    const businessIdStr = String(business._id ?? '');
    await dispatchTemplatedNotification(userIdStr, 'BUSINESS_STATUS', 'BUSINESS_REJECTED', { name: String(business.name ?? ''), reason }, { businessId: businessIdStr, status: String(BUSINESS_STATUS.REJECTED) });
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
    const { dispatchTemplatedNotification } = await import('../../domains/notifications/application/NotificationService');
    await dispatchTemplatedNotification(business.userId.toString(), 'BUSINESS_STATUS', 'BUSINESS_EXPIRED', { name: business.name }, { businessId: id, status: BUSINESS_STATUS.EXPIRED });
    return Business.findById(id).lean();
};
