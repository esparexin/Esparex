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
  userPlan?: any;
  planCatalogItem?: any;
  userWallet?: any;
  entitlements?: any[];
  boosts?: any[];
  creditTransactions?: any[];
  paymentTransactions?: any[];
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

  private static mapSubscription(userPlan?: any, planCatalogItem?: any): SubscriptionSummaryDTO | null {
    if (!userPlan) return null;

    const planName = planCatalogItem?.name || userPlan.planId?.name || 'Subscription Plan';
    const category = (planCatalogItem?.category || userPlan.planId?.category || 'PRO').toUpperCase() as SubscriptionSummaryDTO['category'];
    const status = (userPlan.status || 'ACTIVE').toUpperCase() as SubscriptionSummaryDTO['status'];

    let daysRemaining: number | null = null;
    if (userPlan.endDate) {
      const now = new Date();
      const end = new Date(userPlan.endDate);
      const diffMs = end.getTime() - now.getTime();
      daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    }

    return {
      planId: userPlan.planId?._id?.toString() || userPlan.planId?.toString() || '',
      planName,
      category: ['FREE', 'BASIC', 'PRO', 'BUSINESS', 'ENTERPRISE'].includes(category) ? category : 'PRO',
      status: ['ACTIVE', 'EXPIRED', 'SUSPENDED'].includes(status) ? status : 'ACTIVE',
      startDate: userPlan.startDate ? new Date(userPlan.startDate).toISOString() : new Date().toISOString(),
      endDate: userPlan.endDate ? new Date(userPlan.endDate).toISOString() : null,
      daysRemaining,
      autoRenew: true,
    };
  }

  private static mapWallet(userWallet?: any, entitlements?: any[]): WalletSummaryDTO {
    const monthlyFreeTotal = userWallet?.monthlyFreeAdsTotal ?? 5;
    const usedFree = userWallet?.monthlyFreeAdsUsed || 0;
    const remainingFree = Math.max(0, monthlyFreeTotal - usedFree);

    const activeSpotlightEntitlements = (entitlements || [])
      .filter((e) => e.status === 'ACTIVE' && ['SPOTLIGHT_CAT', 'SPOTLIGHT_HP'].includes(e.type))
      .reduce((acc, e) => acc + (e.remaining || 0), 0);

    const activeTopAdEntitlements = (entitlements || [])
      .filter((e) => e.status === 'ACTIVE' && e.type === 'PUSH_TO_TOP')
      .reduce((acc, e) => acc + (e.remaining || 0), 0);

    const activeAdEntitlements = (entitlements || [])
      .filter((e) => e.status === 'ACTIVE' && e.type === 'AD_POSTING')
      .reduce((acc, e) => acc + (e.remaining || 0), 0);

    const spotlightCredits = Math.max(userWallet?.spotlightCredits || 0, activeSpotlightEntitlements);
    const topAdCredits = Math.max(userWallet?.boostCredits || 0, activeTopAdEntitlements);
    const paidAdCredits = Math.max(userWallet?.adCredits || 0, activeAdEntitlements);

    return {
      userId: userWallet?.userId?.toString() || '',
      monthlyFreeAdsTotal: monthlyFreeTotal,
      monthlyFreeAdsUsed: usedFree,
      monthlyFreeAdsRemaining: remainingFree,
      paidAdCredits,
      spotlightCredits,
      topAdCredits,
      smartAlertSlots: userWallet?.smartAlertSlots || 2,
      nextMonthlyResetDate: userWallet?.lastMonthlyReset ? new Date(userWallet.lastMonthlyReset).toISOString() : null,
    };
  }

  private static mapCreditPacks(entitlements: any[]): CreditPackDTO[] {
    return entitlements.map((ent) => {
      const startsAt = ent.startsAt ? new Date(ent.startsAt) : new Date();

      // Priority Expiry Resolution:
      // 1. Entitlement.expiresAt
      // 2. Transaction.planSnapshot.durationDays
      // 3. Legacy Compatibility Layer (30-day default)
      let resolvedExpiry: Date;
      if (ent.expiresAt) {
        resolvedExpiry = new Date(ent.expiresAt);
      } else if (typeof ent.planDurationDays === 'number' && ent.planDurationDays > 0) {
        resolvedExpiry = new Date(startsAt.getTime() + ent.planDurationDays * 24 * 60 * 60 * 1000);
      } else {
        resolvedExpiry = new Date(startsAt.getTime() + 30 * 24 * 60 * 60 * 1000);
      }

      return {
        packId: ent._id?.toString() || ent.id || '',
        planName: ent.planName || undefined,
        entitlementType: (ent.type || 'AD_POSTING') as EntitlementType,
        totalGranted: ent.quantity || 0,
        consumed: ent.consumed || 0,
        remaining: ent.remaining || 0,
        sourceType: (ent.sourceType || 'PURCHASED_PACK') as EntitlementSourceType,
        purchaseDate: startsAt.toISOString(),
        expiresAt: resolvedExpiry.toISOString(),
        status: (ent.status || 'ACTIVE') as EntitlementStatus,
      };
    });
  }

  private static mapPromotions(boosts: any[]): PromotionDTO[] {
    const seenEntityIds = new Set<string>();
    const uniqueBoosts: any[] = [];

    for (const boost of boosts) {
      const entityId = (boost.entityId?.toString() || boost.adId?.toString() || '').trim();
      if (entityId && seenEntityIds.has(entityId)) {
        continue;
      }
      if (entityId) {
        seenEntityIds.add(entityId);
      }
      uniqueBoosts.push(boost);
    }

    return uniqueBoosts.slice(0, 10).map((boost) => {
      const startsAt = boost.startsAt ? new Date(boost.startsAt) : new Date();
      const endsAt = boost.endsAt ? new Date(boost.endsAt) : new Date();
      const now = new Date();
      const diffMs = endsAt.getTime() - now.getTime();
      const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      const rawType = boost.boostType || boost.type || 'SPOTLIGHT_CAT';
      const meta = getEntitlementPresentationMeta(rawType);

      return {
        promotionId: boost._id?.toString() || boost.id || '',
        entityId: boost.entityId?.toString() || boost.adId?.toString() || '',
        entityTitle: boost.entityTitle || boost.adTitle || 'Promoted Listing',
        type: meta.label as EntitlementType,
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        daysRemaining,
      };
    });
  }

  private static mapRecentUsage(transactions: any[]): CreditLedgerDTO[] {
    return transactions.slice(0, 10).map((tx) => ({
      transactionId: tx._id?.toString() || tx.id || '',
      type: (tx.type || 'DEBIT') as CreditLedgerDTO['type'],
      creditPool: (tx.creditPool || 'PURCHASED') as CreditLedgerDTO['creditPool'],
      amount: tx.amount || 1,
      entitlementType: 'AD_POSTING',
      reason: tx.reason || 'Credit Transaction',
      listingId: tx.listingId?.toString(),
      createdAt: tx.createdAt ? new Date(tx.createdAt).toISOString() : new Date().toISOString(),
    }));
  }

  private static mapRecentPayments(payments: any[]): PaymentSummaryDTO[] {
    const fifteenMinsAgo = Date.now() - 15 * 60 * 1000;

    // Filter to retain SUCCESS orders and recent active PENDING checkout attempts (< 15 mins)
    const activePayments = (payments || []).filter((pay) => {
      const rawStatus = String(pay.status || '').toUpperCase();
      if (['SUCCESS', 'CAPTURED', 'PAID'].includes(rawStatus)) {
        return true;
      }
      const createdAtMs = pay.createdAt ? new Date(pay.createdAt).getTime() : 0;
      // Retain pending checkout sessions created within the last 15 minutes
      return ['INITIATED', 'CREATED', 'PENDING'].includes(rawStatus) && createdAtMs > fifteenMinsAgo;
    });

    return activePayments.slice(0, 10).map((pay) => {
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

      return {
        orderId: pay._id?.toString() || pay.orderId || pay.id || '',
        amount: pay.amount || 0,
        currency: pay.currency || 'INR',
        status,
        description: pay.description || pay.title || pay.planSnapshot?.name || 'Payment Order',
        invoicePdfUrl: pay.invoicePdfUrl || pay.invoiceUrl || `/api/v1/payment/invoice/${pay._id?.toString() || pay.id || ''}`,
        createdAt: pay.createdAt ? new Date(pay.createdAt).toISOString() : new Date().toISOString(),
      };
    });
  }
}
