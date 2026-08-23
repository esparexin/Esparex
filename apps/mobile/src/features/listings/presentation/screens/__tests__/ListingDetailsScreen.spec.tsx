import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

jest.mock('../../../../../bootstrap', () => ({
  services: {
    listingService: {
      getListingDetails: jest.fn(),
    },
    chatService: {
      startChat: jest.fn(),
    },
  },
}));

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useRoute: () => ({
    params: { id: 'ad-details-100' },
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

import { ListingDetailsScreen } from '../ListingDetailsScreen';
import { useListingDetails } from '../../hooks/useListingDetails';
import { useNearbyBusinesses } from '../../hooks/useNearbyBusinesses';
import { useToggleSaveListing } from '../../hooks/useToggleSaveListing';
import { useSavedListings } from '../../hooks/useSavedListings';
import { Listing } from '../../../domain/Listing';

jest.mock('../../hooks/useListingDetails');
jest.mock('../../hooks/useNearbyBusinesses', () => ({
  useNearbyBusinesses: jest.fn().mockReturnValue({ data: [], isLoading: false }),
}));
jest.mock('../../hooks/useToggleSaveListing', () => ({
  useToggleSaveListing: jest.fn().mockReturnValue({ mutate: jest.fn() }),
}));
jest.mock('../../hooks/useSavedListings', () => ({
  useSavedListings: jest.fn().mockReturnValue({ data: [] }),
}));

const mockUseListingDetails = useListingDetails as jest.MockedFunction<typeof useListingDetails>;

describe('ListingDetailsScreen', () => {
  const sampleListing: Listing = {
    id: 'ad-details-100',
    title: 'MacBook Pro M2 16-inch',
    description: '16GB RAM 512GB SSD Space Gray',
    price: { amount: 145000, currency: 'INR', formatted: '₹1,45,000' },
    seller: { id: 'usr-88', name: 'Tech Store', type: 'business', isVerified: true },
    images: [{ url: 'https://storage.esparex.in/macbook.jpg', isPrimary: true }],
    status: 'live',
    createdAt: new Date(),
    isFeatured: true,
    isPremium: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading activity indicator when details query is pending', () => {
    mockUseListingDetails.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as any);

    const { queryByText } = render(<ListingDetailsScreen />);
    expect(queryByText('MacBook Pro M2 16-inch')).toBeNull();
  });

  it('renders error message when listing fetch fails', () => {
    mockUseListingDetails.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Listing not found'),
    } as any);

    const { getByText } = render(<ListingDetailsScreen />);
    expect(getByText('Error loading listing')).toBeTruthy();
    expect(getByText('Listing not found')).toBeTruthy();
  });

  it('renders listing details, price, seller info, and CTAs when loaded', () => {
    mockUseListingDetails.mockReturnValue({
      data: sampleListing,
      isLoading: false,
      error: null,
    } as any);

    const { getByText } = render(<ListingDetailsScreen />);
    expect(getByText('MacBook Pro M2 16-inch')).toBeTruthy();
    expect(getByText('₹1,45,000')).toBeTruthy();
    expect(getByText('Tech Store')).toBeTruthy();
    expect(getByText('Call Seller')).toBeTruthy();
    expect(getByText('Chat / Message')).toBeTruthy();
  });
});
