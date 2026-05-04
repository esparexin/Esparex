import Ad from '@esparex/core/models/Ad';

export const findServiceForUpdate = async (
    id: string,
    userId: string | { toString(): string },
    businessId: string | { toString(): string } | null | undefined,
    listingType: string
) =>
    Ad.findOne({
        _id: id as any,
        listingType: listingType as any,
        businessId: (businessId || { $exists: false }) as any,
        sellerId: userId as any,
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
        { _id: id as any, listingType: listingType as any, businessId: (businessId || { $exists: false }) as any, sellerId: userId as any },
        updates,
        { new: true }
    );
