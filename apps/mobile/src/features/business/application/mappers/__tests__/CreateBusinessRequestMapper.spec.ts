import { CreateBusinessRequestMapper } from '../CreateBusinessRequestMapper';
import { BusinessFormState } from '../../../domain/BusinessFormState';

describe('CreateBusinessRequestMapper', () => {
  it('correctly maps valid BusinessFormState to CreateBusinessPayload', () => {
    const state: BusinessFormState = {
      name: '  Metro Electronics  ',
      description: '  Quality spare parts and repairs  ',
      businessType: 'Repair services',
      mobile: '9876543210',
      email: '  metro@example.com  ',
      website: 'https://metro.example.com',
      gstNumber: '27AAAAA0000A1Z5',
      address: 'Shop 12, Main Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      documents: [
        { type: 'id_proof', url: 'https://s3.example.com/id.jpg', idProofType: 'aadhaar' },
      ],
    };

    const payload = CreateBusinessRequestMapper.toPayload(state);

    expect(payload.name).toBe('Metro Electronics');
    expect(payload.description).toBe('Quality spare parts and repairs');
    expect(payload.businessTypes).toEqual(['Repair services']);
    expect(payload.mobile).toBe('9876543210');
    expect(payload.email).toBe('metro@example.com');
    expect(payload.location.address).toBe('Shop 12, Main Street');
    expect(payload.location.city).toBe('Mumbai');
    expect(payload.documents).toHaveLength(1);
    expect(payload.documents[0].type).toBe('id_proof');
  });
});
