import type { User } from "@/types/User";
import type { BusinessStatus } from "@shared/types/Business";
import { normalizeBusinessStatus } from "@/lib/status/statusNormalization";

export function canEditBusiness(status: BusinessStatus | undefined) {
    const normalizedStatus = normalizeBusinessStatus(status, 'pending');
    // Allow editing for rejected and pending (users can fix application before review)
    // If no status is provided, it defaults to pending for the guard check
    return normalizedStatus === 'rejected' || normalizedStatus === 'pending';
}

export function canPublishBusiness(status: BusinessStatus | undefined) {
    return normalizeBusinessStatus(status, 'pending') === 'live';
}

export function canRegisterBusiness(user: User) {
    // Require OTP-verified phone to prevent spam registrations
    if (!user.isPhoneVerified) return false;
    return canEditBusiness(user.businessStatus);
}

export function isBusinessPending(user: User) {
    return normalizeBusinessStatus(user.businessStatus, 'pending') === "pending";
}

export function isApprovedBusiness(user: User) {
    return canPublishBusiness(user.businessStatus) &&
        Boolean(user.businessId);
}

export function isRejectedBusiness(user: User) {
    return normalizeBusinessStatus(user.businessStatus, 'pending') === "rejected";
}
