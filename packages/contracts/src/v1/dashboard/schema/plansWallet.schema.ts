import { z } from 'zod';

export const subscriptionSummarySchema = z.object({
  planId: z.string(),
  planName: z.string(),
  category: z.enum(['FREE', 'BASIC', 'PRO', 'BUSINESS', 'ENTERPRISE']),
  status: z.enum(['ACTIVE', 'EXPIRED', 'SUSPENDED']),
  startDate: z.string(),
  endDate: z.string().nullable().optional(),
  daysRemaining: z.number().nullable().optional(),
  autoRenew: z.boolean().optional(),
});

export const walletSummarySchema = z.object({
  userId: z.string(),
  monthlyFreeAdsTotal: z.number().min(0),
  monthlyFreeAdsUsed: z.number().min(0),
  monthlyFreeAdsRemaining: z.number().min(0),
  paidAdCredits: z.number().min(0),
  spotlightCredits: z.number().min(0),
  topAdCredits: z.number().min(0),
  smartAlertSlots: z.number().min(0),
  nextMonthlyResetDate: z.string().nullable().optional(),
});

export const creditPackSchema = z.object({
  packId: z.string(),
  entitlementType: z.enum(['AD_POSTING', 'SPOTLIGHT_HP', 'SPOTLIGHT_CAT', 'PUSH_TO_TOP', 'SMART_ALERT_SLOT', 'BUSINESS_PAGE']),
  totalGranted: z.number().min(0),
  consumed: z.number().min(0),
  remaining: z.number().min(0),
  sourceType: z.enum(['FREE_ALLOWANCE', 'PURCHASED_PACK', 'SUBSCRIPTION_TIER', 'PROMO_CAMPAIGN', 'REFERRAL']),
  purchaseDate: z.string(),
  expiresAt: z.string().nullable().optional(),
  status: z.enum(['PENDING', 'ACTIVE', 'EXHAUSTED', 'EXPIRED', 'SUSPENDED', 'CANCELLED']),
});

export const promotionSchema = z.object({
  promotionId: z.string(),
  entityId: z.string(),
  entityTitle: z.string().optional(),
  type: z.enum(['AD_POSTING', 'SPOTLIGHT_HP', 'SPOTLIGHT_CAT', 'PUSH_TO_TOP', 'SMART_ALERT_SLOT', 'BUSINESS_PAGE']),
  startsAt: z.string(),
  endsAt: z.string(),
  daysRemaining: z.number().optional(),
});

export const creditLedgerSchema = z.object({
  transactionId: z.string(),
  type: z.enum(['CREDIT', 'DEBIT', 'EXPIRE', 'RESET']),
  creditPool: z.enum(['PROMOTIONAL', 'MONTHLY_FREE', 'PURCHASED', 'SUBSCRIPTION']),
  amount: z.number(),
  entitlementType: z.enum(['AD_POSTING', 'SPOTLIGHT_HP', 'SPOTLIGHT_CAT', 'PUSH_TO_TOP', 'SMART_ALERT_SLOT', 'BUSINESS_PAGE']).optional(),
  reason: z.string(),
  listingId: z.string().optional(),
  createdAt: z.string(),
});

export const paymentSummarySchema = z.object({
  orderId: z.string(),
  amount: z.number(),
  currency: z.string(),
  status: z.enum(['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED']),
  description: z.string(),
  invoicePdfUrl: z.string().optional(),
  createdAt: z.string(),
});

export const plansWalletV1Schema = z.object({
  subscription: subscriptionSummarySchema.nullable(),
  wallet: walletSummarySchema,
  creditPacks: z.array(creditPackSchema),
  activePromotions: z.array(promotionSchema),
  recentUsage: z.array(creditLedgerSchema),
  recentPayments: z.array(paymentSummarySchema),
});
