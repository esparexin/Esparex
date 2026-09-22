/**
 * ESPAREX — PLATFORM QUOTAS & BASELINE LIMITS (SSOT)
 * Authoritative default quotas for free users across the platform.
 * Governed by ADR-001 & AGENTS.md.
 */

export const PLATFORM_QUOTAS = {
  FREE_MONTHLY_AD_LIMIT: 5,
  FREE_SMART_ALERT_LIMIT: 2,
} as const;

export type PlatformQuotas = typeof PLATFORM_QUOTAS;
