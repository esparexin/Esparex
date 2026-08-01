import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSearch } from '../useSearch';
import { services } from '../../../../../bootstrap';
import { Listing } from '../../../domain/Listing';

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

describe('useSearch hook', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const sampleListing: Listing = {
    id: 'ad-search-1',
    title: 'iPhone 14 Pro Max',
    description: 'Deep Purple 256GB',
    price: { amount: 85000, currency: 'INR', formatted: '₹85,000' },
    seller: { id: 'usr-1', name: 'Seller', type: 'user', isVerified: true },
    images: [{ url: 'https://storage.esparex.in/img.jpg', isPrimary: true }],
    status: 'live',
    createdAt: new Date(),
    isFeatured: false,
    isPremium: false,
  };

  it('does not run search query when search text is empty', () => {
    const { result } = renderHook(() => useSearch(), { wrapper });

    expect(result.current.debouncedQuery).toBe('');
    expect(result.current.fetchStatus).toBe('idle');
    expect(mockGetMarketplaceFeed).not.toHaveBeenCalled();
  });

  it('debounces query input and executes search after 300ms', async () => {
    mockGetMarketplaceFeed.mockResolvedValueOnce([sampleListing]);

    const { result } = renderHook(() => useSearch(), { wrapper });

    act(() => {
      result.current.handleQueryChange('iPhone');
    });

    expect(result.current.query).toBe('iPhone');
    expect(mockGetMarketplaceFeed).not.toHaveBeenCalled();

    // Fast-forward 300ms debounce timer
    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => expect(result.current.debouncedQuery).toBe('iPhone'));

    expect(mockGetMarketplaceFeed).toHaveBeenCalledWith({
      search: 'iPhone',
      limit: 20,
      page: 1,
    });
  });

  it('resets query immediately on handleClear', () => {
    const { result } = renderHook(() => useSearch(), { wrapper });

    act(() => {
      result.current.handleQueryChange('Samsung');
    });

    act(() => {
      result.current.handleClear();
    });

    expect(result.current.query).toBe('');
    expect(result.current.debouncedQuery).toBe('');
  });
});
