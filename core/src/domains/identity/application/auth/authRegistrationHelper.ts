import User from '../../../../models/User';
import UserPlan from '../../../../models/UserPlan';
import { getActiveFreeDefaultPlan } from '../../../payments/application/PlanService';
// P0-6: wallet bootstrap goes through the entitlements-owned write API.
import { bootstrapWallet } from '../../../entitlements/application/EntitlementWalletWriter';
import logger from '../../../../utils/logger';
import { USER_STATUS, Role } from '@esparex/contracts';
import { canonicalizeToIndian } from '../../../../utils/phoneUtils';

export async function provisionNewUser(mobile: string, name: string, now: Date) {
    const user = await User.create({
        mobile: canonicalizeToIndian(mobile),
        name,
        role: Role.USER,
        status: USER_STATUS.LIVE,
        isPhoneVerified: true,
        isVerified: true,
        lastLoginAt: now
    });

    try {
        const freePlan = await getActiveFreeDefaultPlan();

        if (freePlan) {
            const validityDays = freePlan.durationDays && freePlan.durationDays >= 30 ? freePlan.durationDays : 30;
            const expiryDate = new Date(now.getTime() + validityDays * 86400000);
            await UserPlan.findOneAndUpdate(
                { userId: user._id, planId: freePlan._id },
                { $set: { startDate: now, endDate: expiryDate, status: 'active' } },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
        }

        // P0-6: wallet bootstrap via the entitlements-owned write API (was an inline
        // $setOnInsert upsert here).
        await bootstrapWallet({ userId: user._id.toString() });
    } catch (err) {
        logger.error('Default plan assignment & wallet initialization failed', {
            error: err instanceof Error ? err.message : String(err)
        });
    }

    return user;
}
