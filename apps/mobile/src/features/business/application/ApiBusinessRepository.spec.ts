import { ApiBusinessRepository } from './ApiBusinessRepository';
import { apiClient } from '../../../infrastructure/api/apiClient';
import { Business, BUSINESS_STATUS } from '@esparex/contracts';
import { INITIAL_BUSINESS_FORM_STATE } from '../domain/BusinessFormState';

jest.mock('../../../infrastructure/api/apiClient', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
  },
}));

describe('ApiBusinessRepository', () => {
  let repository: ApiBusinessRepository;

  const mockBusiness: Business = {
    id: 'biz_123',
    sellerId: 'usr_123',
    name: 'Auto Spare Hub',
    status: BUSINESS_STATUS.ACTIVE,
    businessTypes: ['Repair services'],
    mobile: '9876543210',
    email: 'autospare@example.com',
    location: {
      address: '101 Industrial Area',
      city: 'Delhi',
      state: 'Delhi',
      pincode: '110001',
    },
    documents: [],
    trustScore: 90,
    isVerified: true,
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new ApiBusinessRepository();
  });

  it('getMyBusiness returns business data when successful', async () => {
    (apiClient.get as jest.Mock).mockResolvedValueOnce({
      data: { data: mockBusiness },
    });

    const result = await repository.getMyBusiness();

    expect(apiClient.get).toHaveBeenCalledWith('/businesses/me');
    expect(result).toEqual(mockBusiness);
  });

  it('getMyBusiness returns null on 404', async () => {
    (apiClient.get as jest.Mock).mockRejectedValueOnce({
      response: { status: 404 },
    });

    const result = await repository.getMyBusiness();

    expect(result).toBeNull();
  });

  it('registerBusiness sends correct payload to POST /businesses', async () => {
    (apiClient.post as jest.Mock).mockResolvedValueOnce({
      data: { data: mockBusiness },
    });

    const formState = {
      ...INITIAL_BUSINESS_FORM_STATE,
      name: 'Auto Spare Hub',
      mobile: '9876543210',
      email: 'autospare@example.com',
      address: '101 Industrial Area',
    };

    const result = await repository.registerBusiness(formState);

    expect(apiClient.post).toHaveBeenCalledWith(
      '/businesses',
      expect.objectContaining({
        name: 'Auto Spare Hub',
        mobile: '9876543210',
        email: 'autospare@example.com',
      })
    );
    expect(result).toEqual(mockBusiness);
  });

  it('updateBusiness sends correct payload to PATCH /businesses/:id', async () => {
    const updatedBusiness = { ...mockBusiness, name: 'Renamed Auto Hub' };
    (apiClient.patch as jest.Mock).mockResolvedValueOnce({
      data: { data: updatedBusiness },
    });

    const result = await repository.updateBusiness('biz_123', {
      name: 'Renamed Auto Hub',
      address: 'New Location, Sector 5',
    });

    expect(apiClient.patch).toHaveBeenCalledWith(
      '/businesses/biz_123',
      expect.objectContaining({
        name: 'Renamed Auto Hub',
        location: expect.objectContaining({
          address: 'New Location, Sector 5',
        }),
      })
    );
    expect(result).toEqual(updatedBusiness);
  });
});
