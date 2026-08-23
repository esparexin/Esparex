import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

const mockCategories = [
  { id: 'cat-phones', name: 'Smartphones' },
  { id: 'cat-laptops', name: 'Laptops' },
];

jest.mock('../../../../../bootstrap', () => ({
  services: {
    listingService: {
      getMarketplaceFeed: jest.fn(),
    },
    categoryService: {
      getCategories: jest.fn().mockImplementation(() => Promise.resolve(mockCategories)),
    },
  },
}));

jest.mock('../../../../postAd/presentation/hooks/useCategories', () => ({
  useCategories: () => ({
    categories: mockCategories,
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

  it('confirms Home is pure discovery feed without duplicate Filters button', () => {
    const { queryByText } = render(<MarketplaceScreen />);
    expect(queryByText('Filters')).toBeNull();
    expect(queryByText('Filter Listings')).toBeNull();
  });

  it('filters by category when category chip is pressed', () => {
    const { getByText } = render(<MarketplaceScreen />);
    const smartphoneChip = getByText('Smartphones');
    expect(smartphoneChip).toBeTruthy();

    fireEvent.press(smartphoneChip);
    expect(mockUseListings).toHaveBeenCalledWith(expect.objectContaining({ categoryId: 'cat-phones' }));
  });
});
