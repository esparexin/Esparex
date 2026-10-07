import Boost from '../../../../models/Boost';
import { getListingRepository } from '../../../../composition/listings';
import { Types } from 'mongoose';

/**
 * Read-model queries for boosts. Mutations (e.g. `expireBoosts`) live in
 * `BoostService` — the canonical Boost write API (P1-3, DECISION-GATE §2/§3).
 */
export async function getActiveBoostsForUser(userId: Types.ObjectId | string) {
    const userListings = await getListingRepository().find({ sellerId: String(userId) });
    const entityIds = userListings.map(l => new Types.ObjectId(l.id));

    return Boost.find({
        entityId: { $in: entityIds },
        isActive: true,
    }).sort({ endsAt: 1 }).lean();
}
