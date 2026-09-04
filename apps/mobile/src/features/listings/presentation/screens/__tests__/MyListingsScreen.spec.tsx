import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

jest.mock('../../../../../providers/AuthProvider', () => ({
  useAuth: () => ({ status: 'authenticated' }),
}));

jest.mock('../../../../../navigation/navigationRef', () => ({
  navigate: jest.fn(),
}));

jest.mock('../../../../../bootstrap', () => ({
  services: {
    listingService: {
      getMyListings: jest.fn(),
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

import { MyListingsScreen } from '../MyListingsScreen';
import { useMyListings } from '../../hooks/useMyListings';
import { Listing } from '../../../domain/Listing';

jest.mock('../../hooks/useMyListings');

const mockUseMyListings = useMyListings as jest.MockedFunction<typeof useMyListings>;

describe('MyListingsScreen Component', () => {
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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders status filter tabs', () => {
    mockUseMyListings.mockReturnValue({
      data: { pages: [[]], pageParams: [1] },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    } as any);

    const { getByText } = render(<MyListingsScreen />);
    expect(getByText('All')).toBeTruthy();
    expect(getByText('Live')).toBeTruthy();
    expect(getByText('Pending')).toBeTruthy();
    expect(getByText('Sold')).toBeTruthy();
  });

  it('renders user listings when data is loaded', () => {
    mockUseMyListings.mockReturnValue({
      data: { pages: [[sampleListing]], pageParams: [1] },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    } as any);

    const { getByText } = render(<MyListingsScreen />);
    expect(getByText('iPhone 13 Pro 128GB')).toBeTruthy();
    expect(getByText('₹55,000')).toBeTruthy();
  });

  it('renders empty state when user has no listings', () => {
    mockUseMyListings.mockReturnValue({
      data: { pages: [[]], pageParams: [1] },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    } as any);

    const { getByText } = render(<MyListingsScreen />);
    expect(getByText('No Listings Found')).toBeTruthy();
    expect(getByText("You haven't created any ads yet.")).toBeTruthy();
  });

  it('filters by status when a status tab is selected', () => {
    mockUseMyListings.mockReturnValue({
      data: { pages: [[]], pageParams: [1] },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    } as any);

    const { getByText } = render(<MyListingsScreen />);
    fireEvent.press(getByText('Live'));
    expect(mockUseMyListings).toHaveBeenCalledWith({ status: 'live' });
  });
});
