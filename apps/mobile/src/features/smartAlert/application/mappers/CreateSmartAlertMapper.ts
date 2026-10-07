import type { SmartAlertCreatePayload } from '@esparex/contracts';
import { SmartAlertFormState } from '../../domain/SmartAlertFormState';

/**
 * Phase 3a (§5): the local `CreateSmartAlertPayload` interface that shadowed
 * the canonical contract type is deleted. This mapper now targets the
 * canonical `SmartAlertCreatePayload` from `@esparex/contracts`.
 */
export class CreateSmartAlertMapper {
  static toPayload(state: SmartAlertFormState): SmartAlertCreatePayload {
    const minP = state.minPrice.trim() ? parseFloat(state.minPrice.trim()) : undefined;
    const maxP = state.maxPrice.trim() ? parseFloat(state.maxPrice.trim()) : undefined;

    if (typeof minP === 'number' && typeof maxP === 'number' && maxP < minP) {
      throw new Error('Maximum price must be greater than or equal to minimum price');
    }

    const alertName = state.name.trim() || state.keywords.trim() || state.category.trim() || 'Smart Alert';

    return {
      name: alertName,
      criteria: {
        keywords: state.keywords.trim() || undefined,
        category: state.category.trim() || undefined,
        minPrice: minP,
        maxPrice: maxP,
        location: state.location.trim() || undefined,
      },
      radiusKm: state.radiusKm || 25,
      frequency: state.frequency || 'instant',
      notificationChannels: ['push'],
    };
  }
}
