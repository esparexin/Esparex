import mongoose from 'mongoose';
import { userRepository } from '../../../../composition/identity';
import { LISTING_STATUS, type SellerPublicUser, type SellerProfileServiceResult } from '@esparex/contracts';
import * as AdAggregationService from '../../../../domains/listings/application/ad/AdAggregationService';
import Ad from '../../../../models/Ad';
import User from '../../../../models/User';
import { buildPublicAdFilter } from '../../../../utils/FeedVisibilityGuard';

export type PublicSellerItem = {
    id: string;
    name: string;
    slug: string;
    status: string;
};

/**
 * Phase 3a (§5): `SellerPublicUser` was an identical duplicate of the
 * canonical symbol in `@esparex/contracts` — now imported.
 * `SellerProfilePayload` is relocated to `@esparex/contracts` as
 * `SellerProfileServiceResult` (canonical owner per DECISION-GATE §3) and
 * re-exported here under its historic name so existing importers
 * (`backend/api/src/controllers/user/userQueryController.ts`) keep working.
 *
 * CONFLICT (recorded, not merged): this shape (service result,
 * `ads: Array<Record<string, unknown>>`) collides by name with the web
 * client's `SellerProfilePayload` (`apps/web/src/lib/api/user/users.ts:73`,
 * client view, `ads: Ad[]`); the web shape is canonicalized as
 * `SellerProfileResponse`. A future gate decision may unify them. Deletion
 * of this shim is Phase 4 (§10).
 */
export type { SellerPublicUser };
export type SellerProfilePayload = SellerProfileServiceResult;

export const getUserProfileById = async (
    userId: string
): Promise<SellerProfilePayload | null> => {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return null;
    }

    const seller = await userRepository.findActiveProfileById(userId);

    if (!seller) {
        return null;
    }

    const sellerAds = await AdAggregationService.getAds(
        {
            sellerId: userId,
            status: LISTING_STATUS.LIVE,
        },
        { page: 1, limit: 20 },
        {}
    );

    const visibleAds = Array.isArray(sellerAds.data) ? sellerAds.data.slice(0, 20) : [];
    const totalActive =
        typeof sellerAds.pagination?.total === 'number'
            ? sellerAds.pagination.total
            : visibleAds.length;

    const normalizedUser: SellerPublicUser = {
        id: typeof seller._id === 'object' && seller._id && 'toHexString' in seller._id && typeof (seller._id as { toHexString: () => string }).toHexString === 'function'
            ? (seller._id as { toHexString: () => string }).toHexString()
            : String(seller._id),
        name: typeof seller.name === 'string' ? seller.name : undefined,
        profilePhoto: typeof seller.avatar === 'string' ? seller.avatar : undefined,
        createdAt: seller.createdAt ? seller.createdAt.toISOString() : undefined,
        isVerified: Boolean(seller.isVerified),
        location: seller.location
            ? {
                city: seller.location.city,
                state: seller.location.state,
                country: seller.location.country,
            }
            : undefined
    };

    return {
        user: normalizedUser,
        listingSummary: {
            totalActive,
            visibleCount: visibleAds.length,
            hasMore: totalActive > visibleAds.length,
        },
        ads: visibleAds
    };
};

export const getPublicSellers = async (
    options: { limit?: number; page?: number } = {}
): Promise<{ items: PublicSellerItem[]; total: number }> => {
    const limit = Math.min(1000, Math.max(1, options.limit ?? 100));
    const page = Math.max(1, options.page ?? 1);
    const skip = (page - 1) * limit;

    const distinctResults = await Ad.aggregate<{ _id: mongoose.Types.ObjectId }>([
        { $match: buildPublicAdFilter() },
        { $group: { _id: '$sellerId' } },
    ]);
    const validSellerIds = distinctResults
        .map((r) => r._id)
        .filter((id) => mongoose.Types.ObjectId.isValid(String(id)));

    if (!validSellerIds.length) {
        return { items: [], total: 0 };
    }

    const total = validSellerIds.length;
    const pagedIds = validSellerIds.slice(skip, skip + limit);

    const users = await User.find({
        _id: { $in: pagedIds },
        status: { $ne: 'deleted' },
        isDeleted: { $ne: true },
    })
        .select('_id name')
        .lean();

    const items: PublicSellerItem[] = users.map((u) => {
        const id = String(u._id);
        const name = typeof u.name === 'string' && u.name.trim() ? u.name.trim() : 'seller';
        const slug = name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '') || 'seller';

        return {
            id,
            name,
            slug,
            status: 'active',
        };
    });

    return { items, total };
};
