import { SmartAlertFormState } from '../../domain/SmartAlertFormState';

export interface CreateSmartAlertPayload {
  name: string;
  criteria: {
    keywords?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    location?: string;
  };
  radiusKm: number;
  frequency: 'instant' | 'daily';
  notificationChannels: string[];
}

export class CreateSmartAlertMapper {
  static toPayload(state: SmartAlertFormState): CreateSmartAlertPayload {
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
