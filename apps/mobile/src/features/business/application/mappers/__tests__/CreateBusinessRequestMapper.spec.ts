import { CreateBusinessRequestMapper } from '../CreateBusinessRequestMapper';
import { BusinessFormState } from '../../../domain/BusinessFormState';

describe('CreateBusinessRequestMapper', () => {
  it('correctly maps valid BusinessFormState to the canonical CreateBusinessPayload', () => {
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
        { type: 'business_proof', url: 'https://s3.example.com/shop.jpg' },
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
    // Canonical documents shape: typed entries partitioned into idProof/businessProof
    expect(payload.documents.idProofType).toBe('aadhaar');
    expect(payload.documents.idProof).toEqual(['https://s3.example.com/id.jpg']);
    expect(payload.documents.businessProof).toEqual(['https://s3.example.com/shop.jpg']);
    expect(payload.documents.certificates).toBeUndefined();
  });

  it('omits empty optionals and defaults idProofType', () => {
    const state: BusinessFormState = {
      name: 'Test Shop',
      description: '',
      businessType: '',
      mobile: '9876543210',
      email: 'test@example.com',
      website: '',
      gstNumber: '',
      address: 'Shop 1',
      city: '',
      state: '',
      pincode: '',
      documents: [],
    };

    const payload = CreateBusinessRequestMapper.toPayload(state);

    expect(payload.description).toBeUndefined();
    expect(payload.website).toBeUndefined();
    expect(payload.location.city).toBeUndefined();
    expect(payload.businessTypes).toEqual(['Repair services']);
    expect(payload.documents.idProofType).toBe('aadhaar');
    expect(payload.documents.idProof).toEqual([]);
  });
});
