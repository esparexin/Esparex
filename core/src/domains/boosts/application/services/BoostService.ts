import Boost from '../../../../models/Boost';
import { getListingRepository } from '../../../../composition/listings';
import { Types } from 'mongoose';

export async function getActiveBoostsForUser(userId: Types.ObjectId | string) {
    const userListings = await getListingRepository().find({ sellerId: String(userId) });
    const entityIds = userListings.map(l => new Types.ObjectId(l.id));

    return Boost.find({
        entityId: { $in: entityIds },
        isActive: true,
    }).sort({ endsAt: 1 }).lean();
}
