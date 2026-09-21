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

export interface RawAdMetadata {
  _id?: unknown;
  title?: string;
  slug?: string;
  seoSlug?: string;
  status?: string;
  expiresAt?: Date | string;
}

export interface RawDashboardData {
  userPlan?: unknown;
  planCatalogItem?: unknown;
  userWallet?: unknown;
  entitlements?: unknown[];
  boosts?: unknown[];
  creditTransactions?: unknown[];
  paymentTransactions?: unknown[];
  adMap?: Map<string, RawAdMetadata>;
}

export class PlansWalletMapper {
  public static mapToV1DTO(data: RawDashboardData): PlansWalletV1DTO {
    return {
      subscription: this.mapSubscription(data.userPlan as Record<string, unknown> | undefined, data.planCatalogItem as Record<string, unknown> | undefined),
      wallet: this.mapWallet(data.userWallet as Record<string, unknown> | undefined, data.entitlements as Record<string, unknown>[] | undefined),
      creditPacks: this.mapCreditPacks((data.entitlements || []) as Record<string, unknown>[]),
      activePromotions: this.mapPromotions((data.boosts || []) as Record<string, unknown>[]),
      recentUsage: this.mapRecentUsage((data.creditTransactions || []) as Record<string, unknown>[], data.adMap),
      recentPayments: this.mapRecentPayments((data.paymentTransactions || []) as Record<string, unknown>[]),
    };
  }

  private static mapSubscription(userPlan?: Record<string, unknown>, planCatalogItem?: Record<string, unknown>): SubscriptionSummaryDTO | null {
    if (!userPlan) return null;

    const userPlanIdObj = userPlan.planId as Record<string, unknown> | undefined;
    const planName = (planCatalogItem?.name as string) || (userPlanIdObj?.name as string) || 'Subscription Plan';
    const category = ((planCatalogItem?.category as string) || (userPlanIdObj?.category as string) || 'PRO').toUpperCase() as SubscriptionSummaryDTO['category'];
    const isDateExpired = userPlan.endDate ? new Date(String(userPlan.endDate)).getTime() < Date.now() : false;
    const rawStatus = ((userPlan.status as string) || 'ACTIVE').toUpperCase();
    const status = isDateExpired ? 'EXPIRED' : (['ACTIVE', 'EXPIRED', 'SUSPENDED'].includes(rawStatus) ? (rawStatus as SubscriptionSummaryDTO['status']) : 'ACTIVE');

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
      status,
      startDate: userPlan.startDate ? new Date(String(userPlan.startDate)).toISOString() : new Date().toISOString(),
      endDate: userPlan.endDate ? new Date(String(userPlan.endDate)).toISOString() : null,
      daysRemaining,
    };
  }

  private static mapWallet(userWallet?: Record<string, unknown>, entitlements?: Record<string, unknown>[]): WalletSummaryDTO {
    const monthlyFreeTotal = (userWallet?.monthlyFreeAdsTotal as number | undefined) ?? 5;
    const usedFree = (userWallet?.monthlyFreeAdsUsed as number | undefined) || 0;
    const remainingFree = Math.max(0, monthlyFreeTotal - usedFree);

    const nowTime = Date.now();
    const isEntitlementActive = (e: Record<string, unknown>): boolean => {
      const rawStatus = ((e.status as string) || 'ACTIVE').toUpperCase();
      if (['EXPIRED', 'EXHAUSTED', 'CONSUMED', 'REVOKED'].includes(rawStatus)) return false;
      const remaining = typeof e.remaining === 'number' ? e.remaining : 0;
      if (remaining <= 0) return false;
      if (e.expiresAt) {
        return new Date(String(e.expiresAt)).getTime() >= nowTime;
      }
      if (typeof e.planDurationDays === 'number' && e.planDurationDays > 0) {
        const startsAt = e.startsAt ? new Date(String(e.startsAt)).getTime() : 0;
        return startsAt + (e.planDurationDays as number) * 24 * 60 * 60 * 1000 >= nowTime;
      }
      return true;
    };

    const hasEntitlementsList = Array.isArray(entitlements);

    const activeSpotlightEntitlements = (entitlements || [])
      .filter((e) => isEntitlementActive(e) && ['SPOTLIGHT_CAT', 'SPOTLIGHT_HP'].includes(e.type as string))
      .reduce((acc, e) => acc + ((e.remaining as number) || 0), 0);

    const activeTopAdEntitlements = (entitlements || [])
      .filter((e) => isEntitlementActive(e) && e.type === 'PUSH_TO_TOP')
      .reduce((acc, e) => acc + ((e.remaining as number) || 0), 0);

    const activeAdEntitlements = (entitlements || [])
      .filter((e) => isEntitlementActive(e) && e.type === 'AD_POSTING')
      .reduce((acc, e) => acc + ((e.remaining as number) || 0), 0);

    const activeSmartAlertEntitlements = (entitlements || [])
      .filter((e) => isEntitlementActive(e) && e.type === 'SMART_ALERT_SLOT')
      .reduce((acc, e) => acc + ((e.remaining as number) || 0), 0);

    // Per ADR-001 & SSOT: Entitlements are authoritative for active balances.
    const spotlightCredits = hasEntitlementsList ? activeSpotlightEntitlements : ((userWallet?.spotlightCredits as number) || 0);
    const topAdCredits = hasEntitlementsList ? activeTopAdEntitlements : ((userWallet?.boostCredits as number) || 0);
    const paidAdCredits = hasEntitlementsList ? activeAdEntitlements : ((userWallet?.adCredits as number) || 0);
    const FREE_ALERT_BASE = 2; // base free slots per ADR-001 / UserWallet default
    const smartAlertSlots = hasEntitlementsList
      ? FREE_ALERT_BASE + activeSmartAlertEntitlements
      : ((userWallet?.smartAlertSlots as number | undefined) || FREE_ALERT_BASE);

    const now = new Date();
    const nextResetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);

    return {
      userId: (userWallet?.userId as { toString(): string } | undefined)?.toString() || String(userWallet?.userId || ''),
      monthlyFreeAdsTotal: monthlyFreeTotal,
      monthlyFreeAdsUsed: usedFree,
      monthlyFreeAdsRemaining: remainingFree,
      paidAdCredits,
      spotlightCredits,
      topAdCredits,
      smartAlertSlots,
      freeAlertSlotsBase: FREE_ALERT_BASE,
      paidAlertSlots: hasEntitlementsList ? activeSmartAlertEntitlements : Math.max(0, ((userWallet?.smartAlertSlots as number | undefined) || FREE_ALERT_BASE) - FREE_ALERT_BASE),
      nextMonthlyResetDate: nextResetDate.toISOString(),
    };
  }

  private static mapCreditPacks(entitlements: Record<string, unknown>[]): CreditPackDTO[] {
    const nowTime = Date.now();
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

      const rawRemaining = typeof ent.remaining === 'number' ? ent.remaining : 0;
      const isExpired = resolvedExpiry.getTime() < nowTime;
      const rawStatus = ((ent.status as string) || 'ACTIVE').toUpperCase();
      let status: EntitlementStatus;
      if (rawStatus === 'EXHAUSTED' || rawStatus === 'CONSUMED' || rawRemaining === 0) {
        status = 'EXHAUSTED';
      } else if (isExpired || rawStatus === 'EXPIRED') {
        status = 'EXPIRED';
      } else {
        status = 'ACTIVE';
      }

      // Canonical SSOT: When a pack is expired, its available remaining balance is strictly 0.
      const remaining = status === 'EXPIRED' ? 0 : rawRemaining;

      return {
        packId: (ent._id as { toString(): string } | undefined)?.toString() || String(ent.id || ''),
        planName: (ent.planName as string | undefined) || undefined,
        entitlementType: ((ent.type as string) || 'AD_POSTING') as EntitlementType,
        totalGranted: (ent.quantity as number) || 0,
        consumed: (ent.consumed as number) || 0,
        remaining,
        sourceType: ((ent.sourceType as string) || 'PURCHASED_PACK') as EntitlementSourceType,
        purchaseDate: startsAt.toISOString(),
        expiresAt: resolvedExpiry.toISOString(),
        status,
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

  public static mapCreditTransactions(
    transactions: unknown[],
    adMap?: Map<string, RawAdMetadata>
  ): CreditLedgerDTO[] {
    const now = Date.now();
    return (transactions as Record<string, unknown>[]).map((tx) => {
      const listingIdStr = (tx.listingId as { toString(): string } | undefined)?.toString();
      const ad = listingIdStr && adMap ? adMap.get(listingIdStr) : undefined;
      const adTitle = (ad?.title as string | undefined) || undefined;
      const adSlug = ((ad?.seoSlug as string) || (ad?.slug as string) || listingIdStr) || undefined;

      let adStatus: string | undefined = undefined;
      let adExpiresAt: string | undefined = undefined;
      let adRemainingDays: number | undefined = undefined;

      if (ad) {
        const adExpMs = ad.expiresAt ? new Date(String(ad.expiresAt)).getTime() : 0;
        const isExpired = ad.status === 'expired' || (adExpMs > 0 && adExpMs <= now);
        adStatus = isExpired ? 'expired' : ((ad.status as string) || 'active');
        adExpiresAt = ad.expiresAt ? new Date(String(ad.expiresAt)).toISOString() : undefined;
        if (adExpMs > 0) {
          adRemainingDays = Math.max(0, Math.ceil((adExpMs - now) / (1000 * 60 * 60 * 24)));
        }
      }

      const reason = (tx.reason as string) || 'Credit Transaction';
      const reasonLower = reason.toLowerCase();
      const isSpotlight = reasonLower.includes('spotlight');
      const isPushToTop = reasonLower.includes('boost') || reasonLower.includes('top ad') || reasonLower.includes('push_to_top');
      const isAlert = reasonLower.includes('alert');

      let entitlementType: EntitlementType = 'AD_POSTING';
      if (isSpotlight) entitlementType = 'SPOTLIGHT_HP';
      else if (isPushToTop) entitlementType = 'PUSH_TO_TOP';
      else if (isAlert) entitlementType = 'SMART_ALERT_SLOT';

      const metadata = tx.metadata as Record<string, unknown> | undefined;
      const effectiveDurationDays = typeof metadata?.effectiveDurationDays === 'number'
        ? metadata.effectiveDurationDays
        : (isSpotlight ? 1 : undefined);

      const validityText = effectiveDurationDays ? `${effectiveDurationDays} day${effectiveDurationDays > 1 ? 's' : ''}` : undefined;

      const txCreatedMs = tx.createdAt ? new Date(String(tx.createdAt)).getTime() : now;
      let spotlightExpiresAt: string | undefined = undefined;
      let spotlightStatus: 'ACTIVE' | 'EXPIRED' | undefined = undefined;

      if (isSpotlight) {
        const durationDaysCount = effectiveDurationDays || 1;
        const spotEndsMs = txCreatedMs + durationDaysCount * 24 * 60 * 60 * 1000;
        spotlightExpiresAt = new Date(spotEndsMs).toISOString();
        spotlightStatus = spotEndsMs <= now ? 'EXPIRED' : 'ACTIVE';
      }

      return {
        transactionId: (tx._id as { toString(): string } | undefined)?.toString() || String(tx.id || ''),
        type: ((tx.type as string) || 'DEBIT') as CreditLedgerDTO['type'],
        creditPool: ((tx.creditPool as string) || 'PURCHASED') as CreditLedgerDTO['creditPool'],
        amount: (tx.amount as number) || 1,
        entitlementType,
        reason,
        listingId: listingIdStr,
        adTitle,
        adSlug,
        adStatus,
        adExpiresAt,
        adRemainingDays,
        validityText,
        spotlightExpiresAt,
        spotlightStatus,
        createdAt: new Date(txCreatedMs).toISOString(),
      };
    });
  }

  private static mapRecentUsage(
    transactions: Record<string, unknown>[],
    adMap?: Map<string, RawAdMetadata>
  ): CreditLedgerDTO[] {
    return this.mapCreditTransactions(transactions.slice(0, 10), adMap);
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
