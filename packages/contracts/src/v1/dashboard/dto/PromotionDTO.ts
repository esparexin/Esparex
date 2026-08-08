import type { EntitlementType } from '../../entitlement/schema/entitlement.schema';

export interface PromotionDTO {
  promotionId: string;
  entityId: string;
  entityTitle?: string;
  type: EntitlementType;
  startsAt: string;
  endsAt: string;
  daysRemaining?: number;
}
