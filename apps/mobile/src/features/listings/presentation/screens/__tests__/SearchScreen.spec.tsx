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

import { SearchScreen } from '../SearchScreen';
import { useSearch } from '../../hooks/useSearch';
import { Listing } from '../../../domain/Listing';

jest.mock('../../hooks/useSearch');

const mockUseSearch = useSearch as jest.MockedFunction<typeof useSearch>;

describe('SearchScreen', () => {
  const sampleListing: Listing = {
    id: 'ad-500',
    title: 'OnePlus 11 5G',
    description: '16GB RAM 256GB',
    price: { amount: 50000, currency: 'INR', formatted: '₹50,000' },
    seller: { id: 'usr-3', name: 'Mobile Shop', type: 'business', isVerified: true },
    images: [{ url: 'https://storage.esparex.in/img3.jpg', isPrimary: true }],
    status: 'live',
    createdAt: new Date(),
    isFeatured: false,
    isPremium: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders initial prompt when search text is empty', () => {
    mockUseSearch.mockReturnValue({
      query: '',
      debouncedQuery: '',
      handleQueryChange: jest.fn(),
      handleSubmit: jest.fn(),
      handleClear: jest.fn(),
      data: undefined,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    } as any);

    const { getByText } = render(<SearchScreen />);
    expect(getByText('Search for listings')).toBeTruthy();
  });

  it('renders skeleton loading state during search execution', () => {
    mockUseSearch.mockReturnValue({
      query: 'OnePlus',
      debouncedQuery: 'OnePlus',
      handleQueryChange: jest.fn(),
      handleSubmit: jest.fn(),
      handleClear: jest.fn(),
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: jest.fn(),
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    } as any);

    const { queryByText } = render(<SearchScreen />);
    expect(queryByText('OnePlus 11 5G')).toBeNull();
  });

  it('renders matching search results', () => {
    mockUseSearch.mockReturnValue({
      query: 'OnePlus',
      debouncedQuery: 'OnePlus',
      handleQueryChange: jest.fn(),
      handleSubmit: jest.fn(),
      handleClear: jest.fn(),
      data: { pages: [[sampleListing]], pageParams: [1] },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    } as any);

    const { getByText } = render(<SearchScreen />);
    expect(getByText('OnePlus 11 5G')).toBeTruthy();
  });

  it('renders empty search results when no listings match query', () => {
    mockUseSearch.mockReturnValue({
      query: 'NonExistentProduct',
      debouncedQuery: 'NonExistentProduct',
      handleQueryChange: jest.fn(),
      handleSubmit: jest.fn(),
      handleClear: jest.fn(),
      data: { pages: [[]], pageParams: [1] },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    } as any);

    const { getByText } = render(<SearchScreen />);
    expect(getByText('No Listings Found')).toBeTruthy();
    expect(getByText('No items match your search for "NonExistentProduct".')).toBeTruthy();
  });
});
