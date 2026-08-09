import { Types } from 'mongoose';
import UserPlan from '../../../models/UserPlan';
import Entitlement from '../../../models/Entitlement';
import UserWallet from '../../../models/UserWallet';

export interface ExpiryNotificationSummary {
  expiringSubscription: boolean;
  subscriptionDaysLeft?: number;
  expiringPacksCount: number;
  lowCreditWarning: boolean;
}

export class PlansWalletNotificationService {
  /**
   * Scans user subscription and credit packs for imminent expirations (< 7 days)
   * and low credit balance thresholds.
   */
  public static async evaluateExpiryNotifications(userId: string): Promise<ExpiryNotificationSummary> {
    if (!userId) {
      return { expiringSubscription: false, expiringPacksCount: 0, lowCreditWarning: false };
    }

    const userObjId = Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : userId;
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [userPlan, expiringPacks, wallet] = await Promise.all([
      UserPlan.findOne({ userId: userObjId, status: 'active' }).lean(),
      Entitlement.find({
        userId: userObjId,
        status: 'ACTIVE',
        remaining: { $gt: 0 },
        expiresAt: { $ne: null, $lte: sevenDaysFromNow, $gte: now },
      }).lean(),
      UserWallet.findOne({ userId: userObjId }).lean(),
    ]);

    let expiringSubscription = false;
    let subscriptionDaysLeft: number | undefined;

    if (userPlan?.endDate) {
      const diffMs = new Date(userPlan.endDate).getTime() - now.getTime();
      const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      if (daysLeft <= 7 && daysLeft >= 0) {
        expiringSubscription = true;
        subscriptionDaysLeft = daysLeft;
      }
    }

    const lowCreditWarning = (wallet?.adCredits || 0) <= 1 && (wallet?.monthlyFreeAdsUsed || 0) >= 10;

    return {
      expiringSubscription,
      subscriptionDaysLeft,
      expiringPacksCount: expiringPacks.length,
      lowCreditWarning,
    };
  }
}
