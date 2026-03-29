import mongoose from 'mongoose';
import User from '../models/User';
import * as adService from './AdService';

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

type UserProfileDoc = {
    _id: mongoose.Types.ObjectId;
    name?: string;
    avatar?: string;
    createdAt?: Date;
    isVerified?: boolean;
    location?: {
        city?: string;
        state?: string;
        country?: string;
    };
};

export const getUserProfileById = async (
    userId: string
): Promise<SellerProfilePayload | null> => {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return null;
    }

    const objectId = new mongoose.Types.ObjectId(userId);
    const seller = await User.findOne({
        _id: objectId,
        status: { $ne: 'deleted' }
    })
        .select('name avatar createdAt isVerified location.city location.state location.country')
        .lean<UserProfileDoc | null>();

    if (!seller) {
        return null;
    }

    const sellerAds = await adService.getAds(
        {
            sellerId: userId,
            status: 'active',
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
        id: seller._id.toHexString(),
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
