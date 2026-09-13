import mongoose from 'mongoose';
import { userRepository } from '../../../../composition/identity';
import { LISTING_STATUS } from '@esparex/contracts';
import * as AdAggregationService from '../../../../domains/listings/application/ad/ad/AdAggregationService';
import Ad from '../../../../models/Ad';
import User from '../../../../models/User';
import { buildPublicAdFilter } from '../../../../utils/FeedVisibilityGuard';

export type PublicSellerItem = {
    id: string;
    name: string;
    slug: string;
    status: string;
};

export type SellerPublicUser = {
    id: string;
    name?: string;
    profilePhoto?: string;
    createdAt?: string;
    isVerified?: boolean;
    location?: {
        city?: string;
        state?: string;
        country?: string;
    };
};

export type SellerProfilePayload = {
    user: SellerPublicUser;
    listingSummary: {
        totalActive: number;
        visibleCount: number;
        hasMore: boolean;
    };
    ads: Array<Record<string, unknown>>;
};

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
