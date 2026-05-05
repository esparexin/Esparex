import Boost from '../models/Boost';
import Ad from '../models/Ad';
import { Types } from 'mongoose';

export async function getActiveBoostsForUser(userId: Types.ObjectId | string) {
    const userListings = await Ad.find({ sellerId: userId }).select('_id');
    const entityIds = userListings.map(l => l._id);

    return Boost.find({
        entityId: { $in: entityIds },
        isActive: true,
    }).sort({ endsAt: 1 }).lean();
}
