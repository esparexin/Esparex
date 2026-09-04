import { UpdateBusinessRequestMapper } from '../UpdateBusinessRequestMapper';
import { BusinessFormState } from '../../../domain/BusinessFormState';

describe('UpdateBusinessRequestMapper', () => {
  it('correctly maps partial BusinessFormState to UpdateBusinessPayload', () => {
    const partialState: Partial<BusinessFormState> = {
      name: '  Updated Tech Workshop  ',
      description: '  New description with updated information  ',
      mobile: '9876543210',
      address: 'Shop 42, New Market',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411001',
    };

    const payload = UpdateBusinessRequestMapper.toPayload(partialState);

    expect(payload.name).toBe('Updated Tech Workshop');
    expect(payload.description).toBe('New description with updated information');
    expect(payload.mobile).toBe('9876543210');
    expect(payload.location).toEqual({
      address: 'Shop 42, New Market',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411001',
    });
    expect(payload.website).toBeUndefined();
    expect(payload.documents).toBeUndefined();
  });

  it('correctly maps documents when provided in partial state', () => {
    const partialState: Partial<BusinessFormState> = {
      documents: [
        { type: 'business_proof', url: 'https://cdn.example.com/biz.pdf' },
      ],
    };

    const payload = UpdateBusinessRequestMapper.toPayload(partialState);

    expect(payload.documents).toHaveLength(1);
    expect(payload.documents?.[0]).toEqual({
      type: 'business_proof',
      url: 'https://cdn.example.com/biz.pdf',
      idProofType: undefined,
    });
  });
});
