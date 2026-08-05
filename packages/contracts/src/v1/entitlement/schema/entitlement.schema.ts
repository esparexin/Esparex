import { z } from 'zod';

export type EntitlementAction =
  | 'POST'
  | 'BUY_AD_PACK'
  | 'UPGRADE_PLAN'
  | 'RENEW_SUBSCRIPTION'
  | 'VERIFY_BUSINESS'
  | 'COMPLETE_PROFILE'
  | 'CONTACT_SUPPORT';

export type EntitlementReason =
  | 'OK'
  | 'QUOTA_EXHAUSTED'
  | 'ACTIVE_LIMIT_REACHED'
  | 'VERIFICATION_REQUIRED'
  | 'SERVICE_UNAVAILABLE';

export type EntitlementType =
  | 'AD_POSTING'
  | 'SPOTLIGHT_HP'
  | 'SPOTLIGHT_CAT'
  | 'PUSH_TO_TOP'
  | 'SMART_ALERT_SLOT'
  | 'BUSINESS_PAGE';

export type EntitlementSourceType =
  | 'FREE_ALLOWANCE'
  | 'PURCHASED_PACK'
  | 'SUBSCRIPTION_TIER'
  | 'PROMO_CAMPAIGN'
  | 'REFERRAL';

export type EntitlementStatus =
  | 'PENDING'
  | 'ACTIVE'
  | 'EXHAUSTED'
  | 'EXPIRED'
  | 'SUSPENDED'
  | 'CANCELLED';

export type MonetizationErrorCode =
  | 'MON-001' // INSUFFICIENT_CREDITS
  | 'MON-002' // ENTITLEMENT_EXPIRED
  | 'MON-003' // PROMOTION_ALREADY_ACTIVE
  | 'MON-004' // PROJECTION_STALE
  | 'MON-005' // INVALID_PLAN_CODE
  | 'MON-006' // DUPLICATE_PAYMENT
  | 'MON-007' // BENEFIT_NOT_ELIGIBLE
  | 'MON-008'; // QUOTA_EXCEEDED

export interface EntitlementDTO {
  id: string;
  userId: string;
  type: EntitlementType;
  sourceType: EntitlementSourceType;
  sourceId: string;
  quantity: number;
  consumed: number;
  remaining: number;
  startsAt: string;
  expiresAt?: string | null;
  status: EntitlementStatus;
  createdAt: string;
  updatedAt: string;
}

export interface SingleEntitlementState {
  allowed: boolean;
  reason: EntitlementReason;
  action: EntitlementAction;
  limit: number;
  used: number;
  remaining: number;
  paidCredits?: number;
  resetDate?: string;
}

export interface PostingEntitlementMatrixDTO {
  ads: SingleEntitlementState;
  services: SingleEntitlementState;
  spareParts: SingleEntitlementState;
  smartAlerts: SingleEntitlementState;
}

export interface UserBenefitsResponseDTO {
  userTier: string;
  capabilities: {
    canPostAd: boolean;
    canCreateSmartAlert: boolean;
    canAccessBusinessPage: boolean;
    analyticsTier: 'BASIC' | 'ADVANCED' | 'ENTERPRISE';
  };
  balances: {
    freeMonthlySlots: { total: number; used: number; remaining: number; resetsAt: string };
    purchasedAdCredits: { remaining: number; expires?: string | null };
    spotlightCredits: { remaining: number; expires?: string | null };
    topAdCredits: { remaining: number; expires?: string | null };
    smartAlertSlots: { used: number; totalCap: number };
  };
}

export const entitlementSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: z.enum(['AD_POSTING', 'SPOTLIGHT_HP', 'SPOTLIGHT_CAT', 'PUSH_TO_TOP', 'SMART_ALERT_SLOT', 'BUSINESS_PAGE']),
  sourceType: z.enum(['FREE_ALLOWANCE', 'PURCHASED_PACK', 'SUBSCRIPTION_TIER', 'PROMO_CAMPAIGN', 'REFERRAL']),
  sourceId: z.string(),
  quantity: z.number().min(0),
  consumed: z.number().min(0),
  remaining: z.number().min(0),
  startsAt: z.string(),
  expiresAt: z.string().nullable().optional(),
  status: z.enum(['PENDING', 'ACTIVE', 'EXHAUSTED', 'EXPIRED', 'SUSPENDED', 'CANCELLED']),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const postingEntitlementMatrixSchema = z.object({
  ads: z.object({
    allowed: z.boolean(),
    reason: z.string(),
    action: z.string(),
    limit: z.number(),
    used: z.number(),
    remaining: z.number(),
    paidCredits: z.number().optional(),
    resetDate: z.string().optional(),
  }),
  services: z.object({
    allowed: z.boolean(),
    reason: z.string(),
    action: z.string(),
    limit: z.number(),
    used: z.number(),
    remaining: z.number(),
  }),
  spareParts: z.object({
    allowed: z.boolean(),
    reason: z.string(),
    action: z.string(),
    limit: z.number(),
    used: z.number(),
    remaining: z.number(),
  }),
  smartAlerts: z.object({
    allowed: z.boolean(),
    reason: z.string(),
    action: z.string(),
    limit: z.number(),
    used: z.number(),
    remaining: z.number(),
  }),
});
