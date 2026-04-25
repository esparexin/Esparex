import Ad from '@core/models/Ad';

export const findServiceForUpdate = async (
    id: string,
    userId: string | { toString(): string },
    businessId: string | { toString(): string } | null | undefined,
    listingType: string
) =>
    Ad.findOne({
        _id: id,
        listingType,
        businessId: businessId || { $exists: false },
        sellerId: userId,
    })
    .select('images status approvedAt categoryId brandId')
    .lean();

export const updateServiceByOwner = async (
    id: string,
    userId: string | { toString(): string },
    businessId: string | { toString(): string } | null | undefined,
    listingType: string,
    updates: Record<string, unknown>
) =>
    Ad.findOneAndUpdate(
        { _id: id, listingType, businessId: businessId || { $exists: false }, sellerId: userId },
        updates,
        { new: true }
    );
