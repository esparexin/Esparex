import mongoose from 'mongoose';
import { userRepository } from '../composition/identity';
import { LISTING_STATUS } from '@esparex/shared';
import * as AdAggregationService from './ad/AdAggregationService';

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
        id: String(seller._id),
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
