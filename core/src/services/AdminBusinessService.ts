import Business from '../models/Business';
import Ad from '../models/Ad';
import { GOVERNANCE, MS_IN_DAY } from '../config/constants';
import { publishedBusinessStatusQuery } from '../utils/businessStatus';
import { BUSINESS_STATUS } from '../constants/enums/businessStatus';
import { LISTING_STATUS } from "../constants/enums/listingStatus";
import { LISTING_TYPE } from '../constants/enums/listingType';
import { ACTOR_TYPE, type ActorMetadata } from '../constants/enums/actor';
import { serializeBusinessForAdmin } from '../utils/businessSerializer';
import { mutateStatuses, mutateStatus } from './StatusMutationService';
import { AppError } from '../utils/AppError';
import type { AdminLogFn } from './AdminListingsService';
import { dispatchTemplatedNotification } from './NotificationService';
import { recalculateTrustScore } from './TrustService';
import { normalizeLocation } from './location/LocationNormalizer';
import * as businessService from './BusinessService';
import type { IBusiness } from '../models/Business';

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

    const listings = await Ad.find({ businessId: normalizedBusinessId, status: { $ne: LISTING_STATUS.EXPIRED } }).select('_id listingType');
    if (listings.length > 0) {
        await mutateStatuses(listings.map((l) => ({
            domain: (l.listingType === LISTING_TYPE.SERVICE
                ? LISTING_TYPE.SERVICE
                : l.listingType === LISTING_TYPE.SPARE_PART
                    ? 'spare_part_listing'
                    : LISTING_TYPE.AD),
            entityId: l._id.toString(),
            toStatus: LISTING_STATUS.EXPIRED,
            actor: normalizedActor,
            reason,
        })));
    }
    return listings.length;
};

export interface AdminBusinessPaginationParams {
    status?: string;
    locationId?: string;
    search?: string;
    page?: number;
    limit?: number;
    [key: string]: unknown;
}

export const getAdminBusinessAccountsData = (params: AdminBusinessPaginationParams) => {
    const { status, locationId } = params;
    const adminQuery = getBusinessAccountsQuery(status);
    if (locationId) adminQuery.locationId = locationId;
    return Promise.resolve({ adminQuery });
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

export const approveAdminBusiness = async (
    id: string,
    actorId: string,
    logFn: AdminLogFn
) => {
    const business = await businessService.approveBusiness(id, actorId) as IBusiness | null;

    if (!business) {
        throw new AppError('Business not found', 404);
    }

    const expiresAt = (business).expiresAt;
    await logFn('APPROVE_BUSINESS', 'Business', id, { expiresAt });

    await dispatchTemplatedNotification(
        business.userId.toString(),
        'BUSINESS_STATUS',
        'BUSINESS_APPROVED',
        { name: business.name },
        { businessId: business._id.toString(), status: BUSINESS_STATUS.LIVE }
    );

    setImmediate(() => void recalculateTrustScore(business.userId).catch(() => { }));
    return business;
};

export const rejectAdminBusiness = async (
    id: string,
    reason: string,
    actorId: string,
    logFn: AdminLogFn
) => {
    if (!reason) {
        throw new AppError('Rejection reason is required', 400);
    }

    const business = await businessService.rejectBusiness(id, reason, actorId) as IBusiness | null;

    if (!business) {
        throw new AppError('Business not found', 404);
    }

    await logFn('REJECT_BUSINESS', 'Business', id, { reason });

    await dispatchTemplatedNotification(
        business.userId.toString(),
        'BUSINESS_STATUS',
        'BUSINESS_REJECTED',
        { name: business.name, reason },
        { businessId: business._id.toString(), status: BUSINESS_STATUS.REJECTED }
    );

    const actor: { type: string; id: string | undefined } = { type: ACTOR_TYPE.ADMIN, id: actorId };
    await cascadeExpireBusinessListings(business._id, actor, `Cascaded from business rejection: ${reason}`);

    return business;
};

export const suspendAdminBusiness = async (
    id: string,
    reason: string,
    actorId: string,
    logFn: AdminLogFn
) => {
    const finalReason = reason || 'Suspended by admin';

    const business = await mutateStatus({
        domain: 'business',
        entityId: id,
        toStatus: BUSINESS_STATUS.SUSPENDED,
        actor: { type: ACTOR_TYPE.ADMIN, id: actorId },
        reason: finalReason,
        patch: {
            rejectionReason: finalReason
        }
    });

    if (!business) {
        throw new AppError('Business not found', 404);
    }

    await logFn('SUSPEND_BUSINESS', 'Business', id, { reason: finalReason });
    return business;
};

export const updateAdminBusinessFields = async (
    id: string,
    rawBody: Record<string, unknown>,
    actorId: string,
    logFn: AdminLogFn
) => {
    const allowedFields = [
        'name', 'description', 'mobile', 'email', 'website',
        'gstNumber', 'registrationNumber', 'location', 'businessTypes',
    ];
    const patch: Record<string, unknown> = {};
    for (const field of allowedFields) {
        if (Object.prototype.hasOwnProperty.call(rawBody, field)) {
            patch[field] = rawBody[field];
        }
    }
    if (Object.keys(patch).length === 0) {
        throw new AppError('No valid fields provided for update', 400);
    }

    const existingBusiness = await findBusinessForAdmin(id);
    if (!existingBusiness) {
        throw new AppError('Business not found', 404);
    }

    if (patch.location && typeof patch.location === 'object' && !Array.isArray(patch.location)) {
        const incomingLocation = patch.location as Record<string, unknown>;
        const bizDoc = existingBusiness as typeof existingBusiness & { location?: Record<string, unknown>; locationId?: unknown };
        const currentLocation = bizDoc.location;
        const normalizedLocation = await normalizeLocation({
            locationId: incomingLocation.locationId || bizDoc.locationId,
            city: incomingLocation.city || currentLocation?.city,
            state: incomingLocation.state || currentLocation?.state,
            country: incomingLocation.country || currentLocation?.country || 'India',
            display: incomingLocation.display || incomingLocation.address,
            coordinates: incomingLocation.coordinates,
            address: incomingLocation.address,
            pincode: incomingLocation.pincode || currentLocation?.pincode,
        });
        const resolvedLocationPayload = businessService.buildBusinessLocationPayload({
            currentLocation,
            incomingLocation,
            normalizedLocation,
            fallbackLocationId: bizDoc.locationId,
        });

        patch.location = resolvedLocationPayload.location;
        if (resolvedLocationPayload.locationId) {
            patch.locationId = resolvedLocationPayload.locationId;
        }
    }

    const business = await Business.findByIdAndUpdate(id, { $set: patch }, { new: true, runValidators: true }).populate('userId');
    if (!business) {
        throw new AppError('Business not found', 404);
    }
    await logFn('UPDATE_BUSINESS', 'Business', id, { patch });
    return business;
};

export const deleteAdminBusiness = async (
    id: string,
    actorId: string,
    logFn: AdminLogFn
) => {
    const business = await findBusinessForAdmin(id);
    if (!business) {
        throw new AppError('Business not found', 404);
    }

    const bizForDelete = business;
    const businessName = bizForDelete.name;
    const userId = bizForDelete.userId.toString();

    const actor: { type: string; id: string | undefined } = { type: ACTOR_TYPE.ADMIN, id: actorId };
    const cascadedCount = await cascadeExpireBusinessListings(business._id, actor, 'Cascaded from business deletion');

    const deleted = await businessService.softDeleteBusiness(id);

    if (!deleted) {
        throw new AppError('Business not found', 404);
    }

    await logFn('DELETE_BUSINESS', 'Business', id, {
        businessName,
        cascadedListings: cascadedCount
    });

    await dispatchTemplatedNotification(
        userId,
        'BUSINESS_STATUS',
        'BUSINESS_REMOVED',
        { name: businessName },
        { businessId: id, status: BUSINESS_STATUS.DELETED }
    );

    return true;
};
