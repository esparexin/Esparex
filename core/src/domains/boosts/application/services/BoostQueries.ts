import Boost from '../../../../models/Boost';
import { getListingRepository } from '../../../../composition/listings';

/**
 * Read-model queries for boosts. Mutations (e.g. `expireBoosts`) live in
 * `BoostService` — the canonical Boost write API (P1-3, DECISION-GATE §2/§3).
 */
export async function getActiveBoostsForUser(userId: string | { toString(): string }) {
    const userListings = await getListingRepository().find({ sellerId: String(userId) });
    // Listing ids are strings (ListingId = string); Mongoose casts each element
    // to ObjectId per the Boost schema (entityId: Schema.Types.ObjectId), so no
    // direct mongoose import is needed here (C-7 mongoose burn-down).
    const entityIds = userListings.map(l => l.id);

    return Boost.find({
        entityId: { $in: entityIds },
        isActive: true,
    }).sort({ endsAt: 1 }).lean();
}
