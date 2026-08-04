import { CreateSmartAlertMapper } from '../CreateSmartAlertMapper';
import { SmartAlertFormState } from '../../../domain/SmartAlertFormState';

describe('CreateSmartAlertMapper', () => {
  it('correctly maps valid SmartAlertFormState to CreateSmartAlertPayload', () => {
    const state: SmartAlertFormState = {
      name: '  iPhone 13 Alert  ',
      keywords: '  iPhone 13  ',
      category: 'Mobile Phones',
      minPrice: '30000',
      maxPrice: '50000',
      location: 'Mumbai',
      radiusKm: 25,
      frequency: 'instant',
    };

    const payload = CreateSmartAlertMapper.toPayload(state);

    expect(payload.name).toBe('iPhone 13 Alert');
    expect(payload.criteria.keywords).toBe('iPhone 13');
    expect(payload.criteria.category).toBe('Mobile Phones');
    expect(payload.criteria.minPrice).toBe(30000);
    expect(payload.criteria.maxPrice).toBe(50000);
    expect(payload.criteria.location).toBe('Mumbai');
    expect(payload.radiusKm).toBe(25);
    expect(payload.frequency).toBe('instant');
  });

  it('throws an error if maxPrice < minPrice', () => {
    const state: SmartAlertFormState = {
      name: 'Invalid Price Alert',
      keywords: 'TV',
      category: 'Electronics',
      minPrice: '50000',
      maxPrice: '30000',
      location: 'Mumbai',
      radiusKm: 25,
      frequency: 'instant',
    };

    expect(() => CreateSmartAlertMapper.toPayload(state)).toThrow(
      'Maximum price must be greater than or equal to minimum price'
    );
  });
});
