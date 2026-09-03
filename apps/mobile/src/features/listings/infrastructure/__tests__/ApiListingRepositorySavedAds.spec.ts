import { ApiListingRepository } from '../../application/ApiListingRepository';
import { apiClient } from '../../../../infrastructure/api/apiClient';

jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => 'test-uuid-1234'),
}));

jest.mock('../../../../infrastructure/api/apiClient', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('ApiListingRepository - Saved Ads', () => {
  let repository: ApiListingRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new ApiListingRepository();
  });

  it('fetches saved listings from GET /v1/users/saved-ads', async () => {
    const mockAds = [
      {
        id: 'ad-101',
        title: 'iPhone 13 Saved',
        price: 45000,
        category: 'Mobiles',
        images: ['https://example.com/img1.jpg'],
        createdAt: '2026-08-01T10:00:00Z',
      },
    ];

    (apiClient.get as jest.Mock).mockResolvedValueOnce({
      data: { data: mockAds },
    });

    const listings = await repository.getSavedListings();

    expect(apiClient.get).toHaveBeenCalledWith('/users/saved-ads');
    expect(listings.length).toBe(1);
    expect(listings[0].id).toBe('ad-101');
    expect(listings[0].title).toBe('iPhone 13 Saved');
  });

  it('calls DELETE /v1/users/saved-ads/:id when unsaving an ad', async () => {
    (apiClient.delete as jest.Mock).mockResolvedValueOnce({ data: { success: true } });

    await repository.toggleSaveListing('ad-101', true);

    expect(apiClient.delete).toHaveBeenCalledWith('/users/saved-ads/ad-101');
  });

  it('calls POST /v1/users/saved-ads when saving an ad', async () => {
    (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: { success: true } });

    await repository.toggleSaveListing('ad-101', false);

    expect(apiClient.post).toHaveBeenCalledWith('/users/saved-ads', { adId: 'ad-101' });
  });

  describe('getListings', () => {
    const mockAds = [
      {
        id: 'ad-201',
        title: 'MacBook Air M2',
        price: 85000,
        category: 'Laptops',
        images: ['https://example.com/macbook.jpg'],
        createdAt: '2026-08-02T10:00:00Z',
      },
    ];

    it('fetches and maps listings from canonical PaginatedResponse shape', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        data: {
          success: true,
          data: mockAds,
          pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
        },
      });

      const listings = await repository.getListings({ page: 1 });

      expect(apiClient.get).toHaveBeenCalledWith('/listings', { params: { page: 1 } });
      expect(listings.length).toBe(1);
      expect(listings[0].id).toBe('ad-201');
      expect(listings[0].title).toBe('MacBook Air M2');
    });

    it('handles direct array response gracefully', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        data: mockAds,
      });

      const listings = await repository.getListings();

      expect(listings.length).toBe(1);
      expect(listings[0].id).toBe('ad-201');
    });

    it('translates search param to q for backend query', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        data: { success: true, data: mockAds },
      });

      await repository.getListings({ search: 'MacBook' });

      expect(apiClient.get).toHaveBeenCalledWith('/listings', {
        params: { q: 'MacBook' },
      });
    });
  });
});
