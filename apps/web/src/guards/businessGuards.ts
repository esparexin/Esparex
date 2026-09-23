import type { User } from "@esparex/contracts";
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

export function canRegisterBusiness(user: User | null | undefined): boolean {
    // Require OTP-verified mobile to prevent spam registrations
    if (!user || !user.isPhoneVerified) return false;
    // Users who already have an active/live business cannot register another
    if (isApprovedBusiness(user)) return false;
    return true;
}

export function isBusinessPending(user: User | null | undefined) {
    if (!user) return false;
    return normalizeBusinessStatus(user.businessStatus, 'none') === "pending";
}

export function isApprovedBusiness(user: User | null | undefined) {
    if (!user) return false;
    return canPublishBusiness(user.businessStatus);
}

export function isRejectedBusiness(user: User | null | undefined) {
    if (!user) return false;
    return normalizeBusinessStatus(user.businessStatus, 'none') === "rejected";
}
