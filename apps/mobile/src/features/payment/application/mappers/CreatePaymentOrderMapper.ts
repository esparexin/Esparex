import type { CreatePaymentOrderPayload } from '@esparex/contracts';

/**
 * Phase 3a (§5): local `CreatePaymentOrderPayload` relocated to
 * `@esparex/contracts`; re-exported here. Phase 4 deletes this shim.
 */
export type { CreatePaymentOrderPayload };

export class CreatePaymentOrderMapper {
  static toPayload(planId: string): CreatePaymentOrderPayload {
    if (!planId || typeof planId !== 'string') {
      throw new Error('Invalid planId provided for payment order creation');
    }
    return { planId: planId.trim() };
  }
}
