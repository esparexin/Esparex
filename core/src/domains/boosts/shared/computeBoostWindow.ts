/**
 * Boost window math — canonical owner: boosts domain (DECISION-GATE §3, P0-1).
 * Moved here from core/src/domains/payments/utils/promotionDateUtils.ts so both the
 * unified applyPromotion and the retired listings flow share one implementation.
 * The inline `endsAt.setDate(endsAt.getDate() + days)` math in the retired
 * AdPromotionService loses to this function.
 */

export interface BoostWindow {
    startsAt: Date;
    endsAt: Date;
    effectiveDays: number;
}

/**
 * Computes boost/spotlight start/end dates bounded by the ad's expiry.
 * The window is CLAMPED to the ad expiry (never extended past it) — this is the
 * surviving semantic; the retired listings flow rejected instead of clamping.
 */
export function computeBoostWindow(
    adDoc: { expiresAt?: Date | string | null },
    durationDays: number,
    startsAt: Date = new Date()
): BoostWindow {
    const requestedMs = startsAt.getTime() + durationDays * 24 * 60 * 60 * 1000;
    const adExpiresMs = adDoc.expiresAt ? new Date(adDoc.expiresAt).getTime() : requestedMs;
    const effectiveMs = Math.min(requestedMs, adExpiresMs);
    const endsAt = new Date(effectiveMs);
    const effectiveDays = Math.max(1, Math.round((effectiveMs - startsAt.getTime()) / (24 * 60 * 60 * 1000)));
    return { startsAt, endsAt, effectiveDays };
}
