/**
 * Canonical OTP Timing & Limit Configuration (SSOT)
 * 
 * Single source of truth for OTP lifecycle timings across:
 * - Backend (@esparex/core / @esparex/backend-api)
 * - Web Frontend (@esparex/apps-web)
 * - Mobile Frontend (@esparex/apps-mobile)
 */
export const OTP_TIMING = {
    /** Total OTP validity window in seconds (15 minutes, matches MSG91 Widget minimum). */
    EXPIRY_SECONDS: 900,
    /** Minimum delay required between consecutive OTP requests / resends in seconds. */
    RESEND_COOLDOWN_SECONDS: 30,
    /** Maximum number of OTP resend attempts allowed within a single OTP session. */
    MAX_RESEND_ATTEMPTS: 3,
    /** Maximum number of failed verification attempts before account lock / session eviction. */
    MAX_VERIFY_ATTEMPTS: 5,
} as const;

export const OTP_EXPIRY_SECONDS = OTP_TIMING.EXPIRY_SECONDS;
export const OTP_RESEND_COOLDOWN_SECONDS = OTP_TIMING.RESEND_COOLDOWN_SECONDS;
export const OTP_MAX_RESEND_ATTEMPTS = OTP_TIMING.MAX_RESEND_ATTEMPTS;
export const OTP_MAX_ATTEMPTS = OTP_TIMING.MAX_VERIFY_ATTEMPTS;
