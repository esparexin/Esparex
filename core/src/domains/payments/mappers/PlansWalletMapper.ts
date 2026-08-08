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
      wallet: this.mapWallet(data.userWallet),
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

  private static mapWallet(userWallet?: any): WalletSummaryDTO {
    const monthlyFreeTotal = 10;
    const usedFree = userWallet?.monthlyFreeAdsUsed || 0;
    const remainingFree = Math.max(0, monthlyFreeTotal - usedFree);

    return {
      userId: userWallet?.userId?.toString() || '',
      monthlyFreeAdsTotal: monthlyFreeTotal,
      monthlyFreeAdsUsed: usedFree,
      monthlyFreeAdsRemaining: remainingFree,
      paidAdCredits: userWallet?.adCredits || 0,
      spotlightCredits: userWallet?.spotlightCredits || 0,
      topAdCredits: userWallet?.boostCredits || 0,
      smartAlertSlots: userWallet?.smartAlertSlots || 2,
      nextMonthlyResetDate: userWallet?.lastMonthlyReset ? new Date(userWallet.lastMonthlyReset).toISOString() : null,
    };
  }

  private static mapCreditPacks(entitlements: any[]): CreditPackDTO[] {
    return entitlements.slice(0, 5).map((ent) => ({
      packId: ent._id?.toString() || ent.id || '',
      entitlementType: (ent.type || 'AD_POSTING') as EntitlementType,
      totalGranted: ent.quantity || 0,
      consumed: ent.consumed || 0,
      remaining: ent.remaining || 0,
      sourceType: (ent.sourceType || 'PURCHASED_PACK') as EntitlementSourceType,
      purchaseDate: ent.startsAt ? new Date(ent.startsAt).toISOString() : new Date().toISOString(),
      expiresAt: ent.expiresAt ? new Date(ent.expiresAt).toISOString() : null,
      status: (ent.status || 'ACTIVE') as EntitlementStatus,
    }));
  }

  private static mapPromotions(boosts: any[]): PromotionDTO[] {
    return boosts.slice(0, 5).map((boost) => {
      const startsAt = boost.startsAt ? new Date(boost.startsAt) : new Date();
      const endsAt = boost.endsAt ? new Date(boost.endsAt) : new Date();
      const now = new Date();
      const diffMs = endsAt.getTime() - now.getTime();
      const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

      return {
        promotionId: boost._id?.toString() || boost.id || '',
        entityId: boost.entityId?.toString() || boost.adId?.toString() || '',
        entityTitle: boost.entityTitle || boost.adTitle || 'Promoted Listing',
        type: (boost.type || 'SPOTLIGHT_CAT') as EntitlementType,
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
    return payments.slice(0, 5).map((pay) => ({
      orderId: pay._id?.toString() || pay.orderId || pay.id || '',
      amount: pay.amount || 0,
      currency: pay.currency || 'INR',
      status: (pay.status || 'SUCCESS') as PaymentSummaryDTO['status'],
      description: pay.description || pay.title || 'Payment Order',
      invoicePdfUrl: pay.invoicePdfUrl || pay.invoiceUrl,
      createdAt: pay.createdAt ? new Date(pay.createdAt).toISOString() : new Date().toISOString(),
    }));
  }
}
