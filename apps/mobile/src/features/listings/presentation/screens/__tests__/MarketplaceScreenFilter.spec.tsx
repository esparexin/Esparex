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

jest.mock('../../hooks/useListings');

const mockUseListings = useListings as jest.MockedFunction<typeof useListings>;

describe('MarketplaceScreen Filters Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseListings.mockReturnValue({
      data: { pages: [[]], pageParams: [1] },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    } as any);
  });

  it('passes active filter params to useListings hook', () => {
    render(<MarketplaceScreen />);
    expect(mockUseListings).toHaveBeenCalledWith({});
  });

  it('opens FilterModal when Filters button is pressed', () => {
    const { getByText, queryByText } = render(<MarketplaceScreen />);
    expect(queryByText('Filter Listings')).toBeNull();

    fireEvent.press(getByText('Filters'));
    expect(getByText('Filter Listings')).toBeTruthy();
  });
});
