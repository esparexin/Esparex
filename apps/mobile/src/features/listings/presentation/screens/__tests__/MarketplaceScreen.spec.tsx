import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

jest.mock('../../../../../bootstrap', () => ({
  services: {
    listingService: {
      getMarketplaceFeed: jest.fn(),
    },
  },
}));

jest.mock('lucide-react-native', () => {
  const { View } = require('react-native');
  return new Proxy(
    {},
    {
      get: () => View,
    }
  );
});

import { MarketplaceScreen } from '../MarketplaceScreen';
import { useListings } from '../../hooks/useListings';
import { Listing } from '../../../domain/Listing';

jest.mock('../../hooks/useListings');

const mockUseListings = useListings as jest.MockedFunction<typeof useListings>;

describe('MarketplaceScreen', () => {
  const sampleListing: Listing = {
    id: 'ad-100',
    title: 'Samsung Galaxy S22',
    description: '128GB Black',
    price: { amount: 35000, currency: 'INR', formatted: '₹35,000' },
    seller: { id: 'usr-2', name: 'Tech Store', type: 'business', isVerified: true },
    images: [{ url: 'https://storage.esparex.in/img2.jpg', isPrimary: true }],
    status: 'live',
    createdAt: new Date(),
    isFeatured: true,
    isPremium: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders skeleton loading state when loading initial page', () => {
    mockUseListings.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: jest.fn(),
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    } as any);

    const { queryByText } = render(<MarketplaceScreen />);
    expect(queryByText('Samsung Galaxy S22')).toBeNull();
  });

  it('renders listings when data is loaded successfully', () => {
    mockUseListings.mockReturnValue({
      data: { pages: [[sampleListing]], pageParams: [1] },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    } as any);

    const { getByText } = render(<MarketplaceScreen />);
    expect(getByText('Samsung Galaxy S22')).toBeTruthy();
  });

  it('renders empty state when listings list is empty', () => {
    mockUseListings.mockReturnValue({
      data: { pages: [[]], pageParams: [1] },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    } as any);

    const { getByText } = render(<MarketplaceScreen />);
    expect(getByText('No Listings Found')).toBeTruthy();
  });

  it('renders error state and handles retry button press', () => {
    const mockRefetch = jest.fn();
    mockUseListings.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: mockRefetch,
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    } as any);

    const { getByText } = render(<MarketplaceScreen />);
    expect(getByText('Something went wrong')).toBeTruthy();

    const retryButton = getByText('Try Again');
    fireEvent.press(retryButton);
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });
});
