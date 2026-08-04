import { ApiListingRepository } from '../../../application/ApiListingRepository';
import { apiClient } from '../../../../../infrastructure/api/apiClient';

jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => 'test-uuid-1234'),
}));

jest.mock('../../../../../infrastructure/api/apiClient', () => ({
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

    expect(apiClient.get).toHaveBeenCalledWith('/v1/users/saved-ads');
    expect(listings.length).toBe(1);
    expect(listings[0].id).toBe('ad-101');
    expect(listings[0].title).toBe('iPhone 13 Saved');
  });

  it('calls DELETE /v1/users/saved-ads/:id when unsaving an ad', async () => {
    (apiClient.delete as jest.Mock).mockResolvedValueOnce({ data: { success: true } });

    await repository.toggleSaveListing('ad-101', true);

    expect(apiClient.delete).toHaveBeenCalledWith('/v1/users/saved-ads/ad-101');
  });

  it('calls POST /v1/users/saved-ads when saving an ad', async () => {
    (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: { success: true } });

    await repository.toggleSaveListing('ad-101', false);

    expect(apiClient.post).toHaveBeenCalledWith('/v1/users/saved-ads', { adId: 'ad-101' });
  });
});
