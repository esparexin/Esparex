import type {
  PlansWalletV1DTO,
  SubscriptionSummaryDTO,
  WalletSummaryDTO,
  CreditPackDTO,
  PromotionDTO,
  CreditLedgerDTO,
  PaymentSummaryDTO,
  EntitlementType,
  EntitlementSourceType,
  EntitlementStatus,
} from '@esparex/contracts';
import { getEntitlementPresentationMeta } from '@esparex/shared';

export interface RawDashboardData {
  userPlan?: Record<string, unknown>;
  planCatalogItem?: Record<string, unknown>;
  userWallet?: Record<string, unknown>;
  entitlements?: Record<string, unknown>[];
  boosts?: Record<string, unknown>[];
  creditTransactions?: Record<string, unknown>[];
  paymentTransactions?: Record<string, unknown>[];
}

export class PlansWalletMapper {
  public static mapToV1DTO(data: RawDashboardData): PlansWalletV1DTO {
    return {
      subscription: this.mapSubscription(data.userPlan, data.planCatalogItem),
      wallet: this.mapWallet(data.userWallet, data.entitlements),
      creditPacks: this.mapCreditPacks(data.entitlements || []),
      activePromotions: this.mapPromotions(data.boosts || []),
      recentUsage: this.mapRecentUsage(data.creditTransactions || []),
      recentPayments: this.mapRecentPayments(data.paymentTransactions || []),
    };
  }

  private static mapSubscription(userPlan?: Record<string, unknown>, planCatalogItem?: Record<string, unknown>): SubscriptionSummaryDTO | null {
    if (!userPlan) return null;

    const userPlanIdObj = userPlan.planId as Record<string, unknown> | undefined;
    const planName = (planCatalogItem?.name as string) || (userPlanIdObj?.name as string) || 'Subscription Plan';
    const category = ((planCatalogItem?.category as string) || (userPlanIdObj?.category as string) || 'PRO').toUpperCase() as SubscriptionSummaryDTO['category'];
    const status = ((userPlan.status as string) || 'ACTIVE').toUpperCase() as SubscriptionSummaryDTO['status'];

    let daysRemaining: number | null = null;
    if (userPlan.endDate) {
      const now = new Date();
      const end = new Date(String(userPlan.endDate));
      const diffMs = end.getTime() - now.getTime();
      daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    }

    return {
      planId: (userPlanIdObj?._id as { toString(): string } | undefined)?.toString() || String(userPlan.planId || ''),
      planName,
      category: ['FREE', 'BASIC', 'PRO', 'BUSINESS', 'ENTERPRISE'].includes(category) ? category : 'PRO',
      status: ['ACTIVE', 'EXPIRED', 'SUSPENDED'].includes(status) ? status : 'ACTIVE',
      startDate: userPlan.startDate ? new Date(String(userPlan.startDate)).toISOString() : new Date().toISOString(),
      endDate: userPlan.endDate ? new Date(String(userPlan.endDate)).toISOString() : null,
      daysRemaining,
      autoRenew: true,
    };
  }

  private static mapWallet(userWallet?: Record<string, unknown>, entitlements?: Record<string, unknown>[]): WalletSummaryDTO {
    const monthlyFreeTotal = (userWallet?.monthlyFreeAdsTotal as number | undefined) ?? 5;
    const usedFree = (userWallet?.monthlyFreeAdsUsed as number | undefined) || 0;
    const remainingFree = Math.max(0, monthlyFreeTotal - usedFree);

    const activeSpotlightEntitlements = (entitlements || [])
      .filter((e) => e.status === 'ACTIVE' && ['SPOTLIGHT_CAT', 'SPOTLIGHT_HP'].includes(e.type as string))
      .reduce((acc, e) => acc + ((e.remaining as number) || 0), 0);

    const activeTopAdEntitlements = (entitlements || [])
      .filter((e) => e.status === 'ACTIVE' && e.type === 'PUSH_TO_TOP')
      .reduce((acc, e) => acc + ((e.remaining as number) || 0), 0);

    const activeAdEntitlements = (entitlements || [])
      .filter((e) => e.status === 'ACTIVE' && e.type === 'AD_POSTING')
      .reduce((acc, e) => acc + ((e.remaining as number) || 0), 0);

    const spotlightCredits = Math.max((userWallet?.spotlightCredits as number) || 0, activeSpotlightEntitlements);
    const topAdCredits = Math.max((userWallet?.boostCredits as number) || 0, activeTopAdEntitlements);
    const paidAdCredits = Math.max((userWallet?.adCredits as number) || 0, activeAdEntitlements);

    return {
      userId: (userWallet?.userId as { toString(): string } | undefined)?.toString() || String(userWallet?.userId || ''),
      monthlyFreeAdsTotal: monthlyFreeTotal,
      monthlyFreeAdsUsed: usedFree,
      monthlyFreeAdsRemaining: remainingFree,
      paidAdCredits,
      spotlightCredits,
      topAdCredits,
      smartAlertSlots: (userWallet?.smartAlertSlots as number | undefined) || 2,
      nextMonthlyResetDate: userWallet?.lastMonthlyReset ? new Date(String(userWallet.lastMonthlyReset)).toISOString() : null,
    };
  }

  private static mapCreditPacks(entitlements: Record<string, unknown>[]): CreditPackDTO[] {
    return entitlements.map((ent) => {
      const startsAt = ent.startsAt ? new Date(String(ent.startsAt)) : new Date();

      let resolvedExpiry: Date;
      if (ent.expiresAt) {
        resolvedExpiry = new Date(String(ent.expiresAt));
      } else if (typeof ent.planDurationDays === 'number' && ent.planDurationDays > 0) {
        resolvedExpiry = new Date(startsAt.getTime() + ent.planDurationDays * 24 * 60 * 60 * 1000);
      } else {
        resolvedExpiry = new Date(startsAt.getTime() + 30 * 24 * 60 * 60 * 1000);
      }

      return {
        packId: (ent._id as { toString(): string } | undefined)?.toString() || String(ent.id || ''),
        planName: (ent.planName as string | undefined) || undefined,
        entitlementType: ((ent.type as string) || 'AD_POSTING') as EntitlementType,
        totalGranted: (ent.quantity as number) || 0,
        consumed: (ent.consumed as number) || 0,
        remaining: (ent.remaining as number) || 0,
        sourceType: ((ent.sourceType as string) || 'PURCHASED_PACK') as EntitlementSourceType,
        purchaseDate: startsAt.toISOString(),
        expiresAt: resolvedExpiry.toISOString(),
        status: ((ent.status as string) || 'ACTIVE') as EntitlementStatus,
      };
    });
  }

  private static mapPromotions(boosts: Record<string, unknown>[]): PromotionDTO[] {
    const seenEntityIds = new Set<string>();
    const uniqueBoosts: Record<string, unknown>[] = [];

    for (const boost of boosts) {
      const entityId = ((boost.entityId as { toString(): string } | undefined)?.toString() || (boost.adId as { toString(): string } | undefined)?.toString() || '').trim();
      if (entityId && seenEntityIds.has(entityId)) {
        continue;
      }
      if (entityId) {
        seenEntityIds.add(entityId);
      }
      uniqueBoosts.push(boost);
    }

    return uniqueBoosts.slice(0, 10).map((boost) => {
      const startsAt = boost.startsAt ? new Date(String(boost.startsAt)) : new Date();
      const endsAt = boost.endsAt ? new Date(String(boost.endsAt)) : new Date();
      const now = new Date();
      const diffMs = endsAt.getTime() - now.getTime();
      const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      const rawType = (boost.boostType as string) || (boost.type as string) || 'SPOTLIGHT_CAT';
      const meta = getEntitlementPresentationMeta(rawType);

      return {
        promotionId: (boost._id as { toString(): string } | undefined)?.toString() || String(boost.id || ''),
        entityId: (boost.entityId as { toString(): string } | undefined)?.toString() || String(boost.adId || ''),
        entityTitle: (boost.entityTitle as string) || (boost.adTitle as string) || 'Promoted Listing',
        type: meta.label as EntitlementType,
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        daysRemaining,
      };
    });
  }

  private static mapRecentUsage(transactions: Record<string, unknown>[]): CreditLedgerDTO[] {
    return transactions.slice(0, 10).map((tx) => ({
      transactionId: (tx._id as { toString(): string } | undefined)?.toString() || String(tx.id || ''),
      type: ((tx.type as string) || 'DEBIT') as CreditLedgerDTO['type'],
      creditPool: ((tx.creditPool as string) || 'PURCHASED') as CreditLedgerDTO['creditPool'],
      amount: (tx.amount as number) || 1,
      entitlementType: 'AD_POSTING',
      reason: (tx.reason as string) || 'Credit Transaction',
      listingId: (tx.listingId as { toString(): string } | undefined)?.toString(),
      createdAt: tx.createdAt ? new Date(String(tx.createdAt)).toISOString() : new Date().toISOString(),
    }));
  }

  private static mapRecentPayments(payments: Record<string, unknown>[]): PaymentSummaryDTO[] {
    const fifteenMinsAgo = Date.now() - 15 * 60 * 1000;

    // Filter to retain SUCCESS orders and recent active PENDING checkout attempts (< 15 mins)
    const activePayments = (payments || []).filter((pay: Record<string, unknown>) => {
      const rawStatus = String(pay.status || '').toUpperCase();
      if (['SUCCESS', 'CAPTURED', 'PAID'].includes(rawStatus)) {
        return true;
      }
      const createdAtMs = pay.createdAt ? new Date(String(pay.createdAt)).getTime() : 0;
      // Retain pending checkout sessions created within the last 15 minutes
      return ['INITIATED', 'CREATED', 'PENDING'].includes(rawStatus) && createdAtMs > fifteenMinsAgo;
    });

    return activePayments.slice(0, 10).map((pay: Record<string, unknown>) => {
      const rawStatus = String(pay.status || '').toUpperCase();
      let status: PaymentSummaryDTO['status'] = 'PENDING';
      if (['SUCCESS', 'CAPTURED', 'PAID'].includes(rawStatus)) {
        status = 'SUCCESS';
      } else if (rawStatus === 'FAILED') {
        status = 'FAILED';
      } else if (rawStatus === 'REFUNDED') {
        status = 'REFUNDED';
      } else {
        status = 'PENDING';
      }

      const payId = (pay._id as { toString(): string } | undefined)?.toString() || String(pay.orderId || pay.id || '');
      const planSnapshot = pay.planSnapshot as Record<string, unknown> | undefined;

      return {
        orderId: payId,
        amount: (pay.amount as number) || 0,
        currency: (pay.currency as string) || 'INR',
        status,
        description: (pay.description as string) || (pay.title as string) || (planSnapshot?.name as string) || 'Payment Order',
        invoicePdfUrl: (pay.invoicePdfUrl as string) || (pay.invoiceUrl as string) || `/api/v1/payment/invoice/${payId}`,
        createdAt: pay.createdAt ? new Date(String(pay.createdAt)).toISOString() : new Date().toISOString(),
      };
    });
  }
}
