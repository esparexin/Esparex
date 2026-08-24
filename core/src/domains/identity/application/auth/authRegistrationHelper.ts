import User from '../../../../models/User';
import UserPlan from '../../../../models/UserPlan';
import UserWallet from '../../../../models/UserWallet';
import { getActiveFreeDefaultPlan } from '../../../payments/application/PlanService';
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

        await UserWallet.findOneAndUpdate(
            { userId: user._id },
            { $setOnInsert: { adCredits: 0, boostCredits: 0, monthlyFreeAdsUsed: 0, spotlightCredits: 0, smartAlertSlots: 2, lastMonthlyReset: now } },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
    } catch (err) {
        logger.error('Default plan assignment & wallet initialization failed', {
            error: err instanceof Error ? err.message : String(err)
        });
    }

    return user;
}
