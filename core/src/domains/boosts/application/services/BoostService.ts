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

/**
 * Deactivates expired boost records — the canonical Boost write API for expiry
 * (P1-3, DECISION-GATE §2/§3). All Boost mutations funnel through the boosts
 * domain; no caller outside this domain may issue direct `Boost.update*` writes.
 * Returns the number of boost records deactivated.
 */
export async function expireBoosts(now: Date = new Date()): Promise<number> {
    const result = await Boost.updateMany(
        { isActive: true, endsAt: { $lt: now } },
        { $set: { isActive: false } }
    );
    return result.modifiedCount ?? 0;
}
