import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

jest.mock('../../../../../bootstrap', () => ({
  services: {
    listingService: {
      getMarketplaceFeed: jest.fn(),
    },
    categoryService: {
      getCategories: jest.fn().mockResolvedValue([]),
    },
  },
}));

jest.mock('../../../../postAd/presentation/hooks/useCategories', () => ({
  useCategories: () => ({
    categories: [],
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  }),
}));

jest.mock('../../hooks/useSavedListings', () => ({
  useSavedListings: () => ({
    data: [],
    isLoading: false,
    isRefetching: false,
    refetch: jest.fn(),
  }),
}));

jest.mock('../../hooks/useToggleSaveListing', () => ({
  useToggleSaveListing: () => ({
    mutate: jest.fn(),
    isLoading: false,
  }),
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

jest.mock('react-native-safe-area-context', () => {
  const inset = { top: 0, right: 0, bottom: 0, left: 0 };
  return {
    SafeAreaProvider: jest.fn().mockImplementation(({ children }) => children),
    SafeAreaConsumer: jest.fn().mockImplementation(({ children }) => children(inset)),
    SafeAreaView: jest.fn().mockImplementation(({ children }) => children),
    useSafeAreaInsets: jest.fn().mockReturnValue(inset),
  };
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

  it('renders brand header, location, search prompt, and loading skeletons', () => {
    mockUseListings.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: jest.fn(),
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    } as any);

    const { queryByText, getByText, getByPlaceholderText } = render(<MarketplaceScreen />);
    expect(getByText('All India')).toBeTruthy();
    expect(getByPlaceholderText('Search spare parts, laptops, phones…')).toBeTruthy();
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

  it('opens LocationSelectorModal when location header pill is pressed', () => {
    mockUseListings.mockReturnValue({
      data: { pages: [[]], pageParams: [1] },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    } as any);

    const { getByLabelText, getByText } = render(<MarketplaceScreen />);
    const locationPill = getByLabelText('Current location: All India. Tap to change location.');
    expect(locationPill).toBeTruthy();

    fireEvent.press(locationPill);
    expect(getByText('Select Location')).toBeTruthy();
  });
});
