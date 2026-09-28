/**
 * Shared date calculation utilities for promotion services.
 * Extracted to satisfy file-size ratchet (baseline +5) in PromotionService.ts.
 */

export interface BoostWindow {
    startsAt: Date;
    endsAt: Date;
    effectiveDays: number;
}

/**
 * Computes boost/spotlight start/end dates bounded by the ad's expiry.
 */
export function computeBoostWindow(adDoc: { expiresAt?: Date | null }, durationDays: number): BoostWindow {
    const startsAt = new Date();
    const requestedMs = startsAt.getTime() + durationDays * 24 * 60 * 60 * 1000;
    const adExpiresMs = adDoc.expiresAt ? new Date(adDoc.expiresAt).getTime() : requestedMs;
    const effectiveMs = Math.min(requestedMs, adExpiresMs);
    const endsAt = new Date(effectiveMs);
    const effectiveDays = Math.max(1, Math.round((effectiveMs - startsAt.getTime()) / (24 * 60 * 60 * 1000)));
    return { startsAt, endsAt, effectiveDays };
}