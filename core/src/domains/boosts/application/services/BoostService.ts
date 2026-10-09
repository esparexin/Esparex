import Boost from '../../../../models/Boost';

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
