import type { User } from "@/types/User";
import type { Business } from "@/lib/api/user/businesses";
import { normalizeBusinessStatus } from "@/lib/status/statusNormalization";

/**
 * SSOT for Business Status Guards
 */

export function isBusinessRegistered(user: User | null, businessData: Business | null) {
  if (!user) return false;
  const status = normalizeBusinessStatus(businessData?.status || user.businessStatus, 'pending');
  return !!(businessData?.id || user.businessId) && status !== 'deleted';
}

export function isBusinessVerified(user: User | null, businessData: Business | null) {
  if (!user) return false;
  const status = normalizeBusinessStatus(businessData?.status || user.businessStatus, 'pending');
  return status === 'live';
}

export function canEditBusiness(user: User | null, businessData: Business | null) {
  if (!user) return false;
  const status = normalizeBusinessStatus(businessData?.status || user.businessStatus, 'pending');
  // Allow editing for rejected and pending
  return status === 'rejected' || status === 'pending';
}

export function canRegisterBusiness(user: User | null) {
  if (!user) return false;
  // Require OTP-verified phone to prevent spam registrations
  if (!user.isPhoneVerified) return false;
  
  const status = normalizeBusinessStatus(user.businessStatus, 'pending');
  // Only allow if no existing business or if previous one was deleted/rejected
  return !user.businessId || status === 'rejected' || status === 'deleted';
}
