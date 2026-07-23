/**
 * ESPAREX — PROMOTION TYPE ENUM
 * Canonical Single Source of Truth (SSOT) for listing promotion ranks.
 */
export enum PromotionType {
  FREE = 'FREE',
  TOP = 'TOP',
  SPOTLIGHT = 'SPOTLIGHT',
}

export type PromotionTypeValue = `${PromotionType}`;
