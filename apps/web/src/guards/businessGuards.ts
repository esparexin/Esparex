import type { User } from "@/types/User";
import { BusinessStatus } from "@esparex/contracts";
import { normalizeBusinessStatus } from "@/lib/status/statusNormalization";

export function canEditBusiness(status: BusinessStatus | undefined) {
    const normalizedStatus = normalizeBusinessStatus(status, 'none');
    // Allow editing for rejected and pending (users can fix application before review)
    return normalizedStatus === 'rejected' || normalizedStatus === 'pending';
}

export function canPublishBusiness(status: BusinessStatus | undefined) {
    const normalized = normalizeBusinessStatus(status, 'none');
    return normalized === 'active' || normalized === 'live';
}

export function canRegisterBusiness(user: User) {
    // Require OTP-verified mobile to prevent spam registrations
    if (!user.isPhoneVerified) return false;
    return canEditBusiness(user.businessStatus);
}

export function isBusinessPending(user: User) {
    return normalizeBusinessStatus(user.businessStatus, 'none') === "pending";
}

export function isApprovedBusiness(user: User | null | undefined) {
    if (!user) return false;
    return canPublishBusiness(user.businessStatus);
}

export function isRejectedBusiness(user: User) {
    return normalizeBusinessStatus(user.businessStatus, 'none') === "rejected";
}
