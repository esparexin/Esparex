import UserPlan from '../../../models/UserPlan';
import UserWallet from '../../../models/UserWallet';
import Entitlement from '../../../models/Entitlement';
import Boost from '../../../models/Boost';
import Ad from '../../../models/Ad';
import CreditTransaction from '../../../models/CreditTransaction';
import Transaction from '../../../models/Transaction';
import { PlansWalletMapper } from '../mappers/PlansWalletMapper';
import type { PlansWalletV1DTO } from '@esparex/contracts';
import redis from '../../../config/redis';

export class DashboardFacade {
  private static CACHE_TTL_SECONDS = 30;

  /**
   * Primary Entry Point: Aggregates domain models concurrently and projects PlansWalletV1DTO.
   * Governance Rule: READ-ONLY orchestration. MUST NOT perform database mutations.
   */
  public static async getDashboardSnapshot(userId: string): Promise<PlansWalletV1DTO> {
    if (!userId) {
      throw new Error('User ID is required for dashboard snapshot aggregation.');
    }

    // Attempt Redis cache read first
    const cached = await this.getCachedSnapshot(userId);
    if (cached) {
      return cached;
    }

    // Lookup user listings to query active boosts correctly
    const userAds = await Ad.find({ sellerId: userId }).select('_id title').lean();
    const userAdIds = userAds.map((a) => a._id);
    const adTitleMap = new Map(userAds.map((a) => [a._id.toString(), a.title]));

    const [
      userPlanResult,
      userWalletResult,
      entitlementsResult,
      boostsResult,
      creditTxResult,
      paymentTxResult,
    ] = await Promise.allSettled([
      UserPlan.findOne({ userId, status: 'active' }).populate('planId').lean(),
      UserWallet.findOne({ userId }).lean(),
      Entitlement.find({ userId }).sort({ createdAt: -1 }).lean(),
      userAdIds.length > 0
        ? Boost.find({ entityId: { $in: userAdIds }, isActive: true, endsAt: { $gte: new Date() } }).lean()
        : Promise.resolve([]),
      CreditTransaction.find({ userId }).sort({ createdAt: -1 }).limit(10).lean(),
      Transaction.find({ userId }).sort({ createdAt: -1 }).limit(20).lean(),
    ]);

    const userPlan = userPlanResult.status === 'fulfilled' ? userPlanResult.value : undefined;
    const userWallet = userWalletResult.status === 'fulfilled' ? userWalletResult.value : undefined;
    const rawEntitlements = entitlementsResult.status === 'fulfilled' ? entitlementsResult.value || [] : [];

    // Batch resolve planName & durationDays from Transaction.planSnapshot via sourceId (0 N+1 queries)
    const sourceIds = Array.from(
      new Set(
        rawEntitlements
          .map((e: any) => e.sourceId?.toString())
          .filter((id: string | undefined): id is string => Boolean(id))
      )
    );

    const sourceTxRecords = sourceIds.length > 0
      ? await Transaction.find({ _id: { $in: sourceIds } }).select('_id planSnapshot').lean()
      : [];

    const txSnapshotMap = new Map(
      sourceTxRecords.map((tx: any) => [tx._id.toString(), tx.planSnapshot])
    );

    const entitlements = rawEntitlements.map((ent: any) => {
      const snapshot = ent.sourceId ? txSnapshotMap.get(ent.sourceId.toString()) : undefined;
      return {
        ...ent,
        planName: snapshot?.name || ent.planName || undefined,
        planDurationDays: snapshot?.durationDays || undefined,
      };
    });

    const rawBoosts = boostsResult.status === 'fulfilled' ? boostsResult.value || [] : [];
    const boosts = rawBoosts.map((b: any) => ({
      ...b,
      entityTitle: adTitleMap.get(b.entityId?.toString()) || b.entityTitle || b.adTitle || 'Promoted Listing',
    }));
    const creditTransactions = creditTxResult.status === 'fulfilled' ? creditTxResult.value || [] : [];
    const paymentTransactions = paymentTxResult.status === 'fulfilled' ? paymentTxResult.value || [] : [];

    const snapshot = PlansWalletMapper.mapToV1DTO({
      userPlan,
      userWallet,
      entitlements,
      boosts,
      creditTransactions,
      paymentTransactions,
    });

    // Cache the snapshot asynchronously
    void this.cacheSnapshot(userId, snapshot);

    return snapshot;
  }

  /**
   * Redis Cache Read Helper
   */
  public static async getCachedSnapshot(userId: string): Promise<PlansWalletV1DTO | null> {
    try {
      if (!redis) return null;
      const key = `cache:plans_wallet:${userId}`;
      const data = await redis.get(key);
      if (!data) return null;
      return JSON.parse(data) as PlansWalletV1DTO;
    } catch {
      return null;
    }
  }

  /**
   * Redis Cache Write Helper
   */
  public static async cacheSnapshot(userId: string, snapshot: PlansWalletV1DTO): Promise<void> {
    try {
      if (!redis) return;
      const key = `cache:plans_wallet:${userId}`;
      await redis.set(key, JSON.stringify(snapshot), 'EX', this.CACHE_TTL_SECONDS);
    } catch {
      // Ignore cache write errors
    }
  }

  /**
   * Redis Cache Invalidation Helper (Triggered on payment webhook / credit debit / boost apply)
   */
  public static async invalidateCache(userId: string): Promise<void> {
    try {
      if (!redis) return;
      const key = `cache:plans_wallet:${userId}`;
      await redis.del(key);
    } catch {
      // Ignore cache deletion errors
    }
  }
}
