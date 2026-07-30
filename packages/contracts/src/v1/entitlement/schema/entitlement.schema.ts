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
