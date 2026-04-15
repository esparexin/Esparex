import Business from '../models/Business';
import Ad from '../models/Ad';
import { Document, Model } from 'mongoose';
import { GOVERNANCE, MS_IN_DAY } from '../config/constants';
import { publishedBusinessStatusQuery } from '../utils/businessStatus';
import { BUSINESS_STATUS } from '../../../shared/enums/businessStatus';
import { AD_STATUS } from '../../../shared/enums/adStatus';
import { LISTING_TYPE } from '../../../shared/enums/listingType';
import { ACTOR_TYPE, type ActorMetadata } from '../../../shared/enums/actor';
import { serializeBusinessForAdmin } from '../controllers/business/shared';
import { handlePaginatedContent } from '../utils/contentHandler';
import { mutateStatuses } from './StatusMutationService';
import type { Request, Response } from 'express';
import type { ValidDomain } from './StatusMutationService';

/**
 * Service for advanced admin-only business management and metrics.
 */
export const getBusinessOverview = async () => {
    const thirtyDaysFromNow = new Date(Date.now() + GOVERNANCE.BUSINESS.AUTO_EXPIRE_CHECK_DAYS * MS_IN_DAY);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const [
        live,
        pending,
        suspended,
        rejected,
        deleted,
        total,
        expiringSoon,
        timeline,
        topCities,
    ] = await Promise.all([
        Business.countDocuments({ status: BUSINESS_STATUS.LIVE }),
        Business.countDocuments({ status: BUSINESS_STATUS.PENDING }),
        Business.countDocuments({ status: BUSINESS_STATUS.SUSPENDED }),
        Business.countDocuments({ status: BUSINESS_STATUS.REJECTED }),
        Business.countDocuments({ isDeleted: true }).setOptions({ withDeleted: true }),
        Business.countDocuments({}).setOptions({ withDeleted: true }),
        Business.countDocuments({
            status: publishedBusinessStatusQuery,
            expiresAt: { $lte: thirtyDaysFromNow, $gte: new Date() },
            isDeleted: false,
        }),
        Business.aggregate([
            { $match: { createdAt: { $gte: sevenDaysAgo }, isDeleted: { $ne: true } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]),
        Business.aggregate([
            { $match: { isDeleted: { $ne: true }, 'location.city': { $exists: true, $ne: '' } } },
            { $group: { _id: '$location.city', count: { $sum: 1 } } },
            { $sort: { count: -1, _id: 1 } },
            { $limit: 5 },
            { $project: { _id: 0, city: '$_id', count: 1 } },
        ]),
    ]);

    return {
        total,
        pending,
        live,
        suspended,
        rejected,
        deleted,
        expiringSoon,
        analytics: {
            timeline,
            topCities,
        },
    };
};

export const transformBusinessDocs = (items: unknown[]): unknown[] =>
    items.map((doc) => {
        const serialized = serializeBusinessForAdmin(doc);
        return {
            ...serialized,
            businessPhone: serialized.mobile,
            businessEmail: serialized.email,
        };
    });

export const getAdminBusinessById = async (id: string) => {
    return Business.findOne({ _id: id })
        .setOptions({ withDeleted: true })
        .populate('userId');
};

export const findBusinessForAdmin = async (id: string) => {
    return Business.findById(id);
};

export const updateAdminBusiness = async (id: string, patch: Record<string, unknown>) => {
    return Business.findByIdAndUpdate(id, { $set: patch }, { new: true, runValidators: true }).populate('userId');
};

export const cascadeExpireBusinessListings = async (
    businessId: unknown,
    actor: ActorMetadata | { type: string; id?: string | undefined },
    reason: string
) => {
    const normalizedBusinessId = typeof businessId === 'string' && businessId.trim()
        ? businessId.trim()
        : businessId && typeof businessId === 'object' && typeof (businessId as { toString?: () => string }).toString === 'function'
            ? (businessId as { toString: () => string }).toString()
            : undefined;

    if (!normalizedBusinessId) {
        return 0;
    }

    const normalizedActor: ActorMetadata = {
        type: actor.type === ACTOR_TYPE.ADMIN
            ? ACTOR_TYPE.ADMIN
            : actor.type === ACTOR_TYPE.SYSTEM
                ? ACTOR_TYPE.SYSTEM
                : ACTOR_TYPE.USER,
        id: actor.id,
    };

    const listings = await Ad.find({ businessId: normalizedBusinessId, status: { $ne: AD_STATUS.EXPIRED } }).select('_id listingType');
    if (listings.length > 0) {
        await mutateStatuses(listings.map((l) => ({
            domain: (l.listingType === LISTING_TYPE.SERVICE
                ? LISTING_TYPE.SERVICE
                : l.listingType === LISTING_TYPE.SPARE_PART
                    ? 'spare_part_listing'
                    : LISTING_TYPE.AD) as ValidDomain,
            entityId: l._id,
            toStatus: AD_STATUS.EXPIRED,
            actor: normalizedActor,
            reason,
        })));
    }
    return listings.length;
};

export const getAdminBusinessAccountsPaginated = (
    req: Request,
    res: Response,
    status?: string,
    city?: string
) => {
    const adminQuery = getBusinessAccountsQuery(status);
    if (city) (adminQuery)['location.city'] = city;
    return handlePaginatedContent(req, res, Business as unknown as Model<Document>, {
        populate: 'userId',
        searchFields: ['name', 'email', 'mobile', 'location.city'],
        adminQuery,
        transformResponse: transformBusinessDocs,
    });
};

export const getBusinessAccountsQuery = (status?: string) => {
    const adminQuery: Record<string, unknown> = {};
    const normalizedStatus = status === 'approved' || status === 'active'
        ? BUSINESS_STATUS.LIVE
        : status;

    if (normalizedStatus && normalizedStatus !== 'all') {
        if (normalizedStatus === 'expiring') {
            const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            adminQuery.status = publishedBusinessStatusQuery;
            adminQuery.expiresAt = { $lte: sevenDaysFromNow, $gte: new Date() };
        } else if (normalizedStatus === BUSINESS_STATUS.DELETED) {
            adminQuery.isDeleted = true;
        } else {
            adminQuery.status = normalizedStatus;
        }
    }

    return adminQuery;
};
