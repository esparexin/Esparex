import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useListings } from '../useListings';
import { services } from '../../../../../bootstrap';
import { Listing } from '../../../domain/Listing';

// Mock services.listingService
jest.mock('../../../../../bootstrap', () => ({
  services: {
    listingService: {
      getMarketplaceFeed: jest.fn(),
    },
  },
}));

const mockGetMarketplaceFeed = services.listingService.getMarketplaceFeed as jest.MockedFunction<
  typeof services.listingService.getMarketplaceFeed
>;

describe('useListings hook', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const sampleListing: Listing = {
    id: 'ad-1',
    title: 'iPhone 13 Pro',
    description: 'Good condition phone',
    price: { amount: 45000, currency: 'INR', formatted: '₹45,000' },
    seller: { id: 'usr-1', name: 'John', type: 'user', isVerified: true },
    images: [{ url: 'https://storage.esparex.in/img1.jpg', isPrimary: true }],
    status: 'live',
    createdAt: new Date(),
    isFeatured: false,
  };

  it('fetches initial page of listings successfully', async () => {
    mockGetMarketplaceFeed.mockResolvedValueOnce([sampleListing]);

    const { result } = renderHook(() => useListings(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockGetMarketplaceFeed).toHaveBeenCalledWith({
      limit: 20,
      page: 1,
    });
    expect(result.current.data?.pages[0]).toEqual([sampleListing]);
  });

  it('handles empty feed page cleanly', async () => {
    mockGetMarketplaceFeed.mockResolvedValueOnce([]);

    const { result } = renderHook(() => useListings(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.pages[0]).toEqual([]);
    expect(result.current.hasNextPage).toBe(false);
  });

  it('handles error states', async () => {
    mockGetMarketplaceFeed.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useListings(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toEqual(new Error('Network error'));
  });
});
