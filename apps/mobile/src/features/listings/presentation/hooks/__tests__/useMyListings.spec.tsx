import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMyListings } from '../useMyListings';
import { services } from '../../../../../bootstrap';
import { Listing } from '../../../domain/Listing';

jest.mock('../../../../../bootstrap', () => ({
  services: {
    listingService: {
      getMyListings: jest.fn(),
    },
  },
}));

const mockGetMyListings = services.listingService.getMyListings as jest.MockedFunction<
  typeof services.listingService.getMyListings
>;

describe('useMyListings hook', () => {
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
    id: 'ad-my-1',
    title: 'iPhone 13 Pro 128GB',
    description: 'Sierra Blue Excellent Condition',
    price: { amount: 55000, currency: 'INR', formatted: '₹55,000' },
    seller: { id: 'usr-me', name: 'My Account', type: 'user', isVerified: true },
    images: [{ url: 'https://storage.esparex.in/iphone13.jpg', isPrimary: true }],
    status: 'live',
    createdAt: new Date(),
    isFeatured: false,
    isPremium: false,
  };

  it('fetches user listings successfully', async () => {
    mockGetMyListings.mockResolvedValueOnce([sampleListing]);

    const { result } = renderHook(() => useMyListings(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.pages[0]).toEqual([sampleListing]);
    expect(mockGetMyListings).toHaveBeenCalledWith({
      limit: 20,
      page: 1,
    });
  });
});
