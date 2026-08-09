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
    type RawDoc = Record<string, unknown>;
    const typedEntitlements = rawEntitlements as unknown as RawDoc[];

    // Batch resolve planName & durationDays from Transaction.planSnapshot via sourceId (0 N+1 queries)
    const sourceIds = Array.from(
      new Set(
        typedEntitlements
          .map((e) => (e.sourceId as { toString(): string } | undefined)?.toString())
          .filter((id: string | undefined): id is string => Boolean(id))
      )
    );

    const sourceTxRecords = sourceIds.length > 0
      ? await Transaction.find({ _id: { $in: sourceIds } }).select('_id planSnapshot').lean()
      : [];

    const typedSourceTx = sourceTxRecords as unknown as RawDoc[];
    const txSnapshotMap = new Map<string, RawDoc | undefined>(
      typedSourceTx.map((tx) => [(tx._id as { toString(): string }).toString(), tx.planSnapshot as RawDoc | undefined])
    );

    const entitlements = typedEntitlements.map((ent) => {
      const sourceIdStr = (ent.sourceId as { toString(): string } | undefined)?.toString();
      const snapshot = sourceIdStr ? txSnapshotMap.get(sourceIdStr) : undefined;
      return {
        ...ent,
        planName: (snapshot?.name as string | undefined) || (ent.planName as string | undefined) || undefined,
        planDurationDays: (snapshot?.durationDays as number | undefined) || undefined,
      };
    });

    const rawBoosts = boostsResult.status === 'fulfilled' ? boostsResult.value || [] : [];
    const typedBoosts = rawBoosts as unknown as RawDoc[];
    const boosts = typedBoosts.map((b) => {
      const entityIdStr = (b.entityId as { toString(): string } | undefined)?.toString();
      return {
        ...b,
        entityTitle: (entityIdStr ? adTitleMap.get(entityIdStr) : undefined) || (b.entityTitle as string | undefined) || (b.adTitle as string | undefined) || 'Promoted Listing',
      };
    });
    const creditTransactions = creditTxResult.status === 'fulfilled' ? creditTxResult.value || [] : [];
    const paymentTransactions = paymentTxResult.status === 'fulfilled' ? paymentTxResult.value || [] : [];

    const snapshot = PlansWalletMapper.mapToV1DTO({
      userPlan: userPlan ? (userPlan as unknown as RawDoc) : undefined,
      userWallet: userWallet ? (userWallet as unknown as RawDoc) : undefined,
      entitlements: entitlements as unknown as RawDoc[],
      boosts: boosts as unknown as RawDoc[],
      creditTransactions: creditTransactions as unknown as RawDoc[],
      paymentTransactions: paymentTransactions as unknown as RawDoc[],
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
