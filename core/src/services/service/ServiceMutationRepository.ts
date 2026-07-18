import mongoose from 'mongoose';
import Ad from '../../models/Ad';
import { ListingTypeValue } from '@esparex/contracts';

export const findServiceForUpdate = async (
    id: string,
    userId: string | { toString(): string },
    businessId: string | { toString(): string } | null | undefined,
    listingType: string
) => {
    const filter = {
        _id: new mongoose.Types.ObjectId(id),
        listingType: listingType as ListingTypeValue,
        sellerId: new mongoose.Types.ObjectId(userId.toString()),
        businessId: businessId ? new mongoose.Types.ObjectId(businessId.toString()) : { $exists: false }
    };
    return Ad.findOne(filter)
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
    const filter = {
        _id: new mongoose.Types.ObjectId(id),
        listingType: listingType as ListingTypeValue,
        sellerId: new mongoose.Types.ObjectId(userId.toString()),
        businessId: businessId ? new mongoose.Types.ObjectId(businessId.toString()) : { $exists: false }
    };
    return Ad.findOneAndUpdate(filter, updates, { new: true });
};
