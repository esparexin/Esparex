import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useListingDetails } from '../useListingDetails';
import { services } from '../../../../../bootstrap';
import { Listing } from '../../../domain/Listing';

jest.mock('../../../../../bootstrap', () => ({
  services: {
    listingService: {
      getListingDetails: jest.fn(),
    },
  },
}));

const mockGetListingDetails = services.listingService.getListingDetails as jest.MockedFunction<
  typeof services.listingService.getListingDetails
>;

describe('useListingDetails hook', () => {
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
    id: 'ad-details-100',
    title: 'MacBook Pro M2 16-inch',
    description: '16GB RAM 512GB SSD',
    price: { amount: 145000, currency: 'INR', formatted: '₹1,45,000' },
    seller: { id: 'usr-88', name: 'Tech Store', type: 'business', isVerified: true },
    images: [{ url: 'https://storage.esparex.in/macbook.jpg', isPrimary: true }],
    status: 'live',
    createdAt: new Date(),
    isFeatured: true,
    isPremium: false,
  };

  it('fetches listing details for valid listingId', async () => {
    mockGetListingDetails.mockResolvedValueOnce(sampleListing);

    const { result } = renderHook(() => useListingDetails('ad-details-100'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(sampleListing);
    expect(mockGetListingDetails).toHaveBeenCalledWith('ad-details-100');
  });

  it('remains disabled when listingId is empty', () => {
    const { result } = renderHook(() => useListingDetails(''), { wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockGetListingDetails).not.toHaveBeenCalled();
  });
});
