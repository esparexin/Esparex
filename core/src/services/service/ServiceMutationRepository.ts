import mongoose from 'mongoose';
import Ad from '../../models/Ad';

export const findServiceForUpdate = async (
    id: string,
    userId: string | { toString(): string },
    businessId: string | { toString(): string } | null | undefined,
    listingType: string
) => {
    const filter: Record<string, unknown> = {
        _id: new mongoose.Types.ObjectId(id),
        listingType,
        sellerId: new mongoose.Types.ObjectId(userId.toString()),
    };
    if (businessId) {
        filter.businessId = new mongoose.Types.ObjectId(businessId.toString());
    } else {
        filter.businessId = { $exists: false };
    }
    return Ad.findOne(filter as any)
        .select('images status approvedAt categoryId brandId')
        .lean();
};

export const updateServiceByOwner = async (
    id: string,
    userId: string | { toString(): string },
    businessId: string | { toString(): string } | null | undefined,
    listingType: string,
    updates: Record<string, unknown>
) => {
    const filter: Record<string, unknown> = {
        _id: new mongoose.Types.ObjectId(id),
        listingType,
        sellerId: new mongoose.Types.ObjectId(userId.toString()),
    };
    if (businessId) {
        filter.businessId = new mongoose.Types.ObjectId(businessId.toString());
    } else {
        filter.businessId = { $exists: false };
    }
    return Ad.findOneAndUpdate(filter as any, updates, { new: true });
};
