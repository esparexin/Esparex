import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

jest.mock('../../../../../bootstrap', () => ({
  services: {
    listingService: {
      getListingDetails: jest.fn(),
      getListingPhone: jest.fn().mockResolvedValue({ phone: '+919876543210' }),
      incrementListingView: jest.fn().mockResolvedValue(undefined),
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
import { useProfile } from '../../../../user/presentation/hooks/useProfile';
import { Listing } from '../../../domain/Listing';

jest.mock('../../../../../providers/AuthProvider', () => ({
  useAuth: () => ({ status: 'authenticated' }),
}));
jest.mock('../../hooks/useListingDetails');
jest.mock('../../../../user/presentation/hooks/useProfile');
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
const mockUseProfile = useProfile as jest.MockedFunction<typeof useProfile>;

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
    mockUseProfile.mockReturnValue({
      data: { id: 'usr-viewer-123', name: 'Other User' },
    } as any);
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

  it('renders listing details, price, seller info, and CTAs when loaded for non-owner', () => {
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

  it('renders Edit Listing CTA when viewer is the listing owner', () => {
    mockUseProfile.mockReturnValue({
      data: { id: 'usr-88', name: 'Tech Store Owner' },
    } as any);

    mockUseListingDetails.mockReturnValue({
      data: sampleListing,
      isLoading: false,
      error: null,
    } as any);

    const { getByText, queryByText } = render(<ListingDetailsScreen />);
    expect(getByText('Edit Listing')).toBeTruthy();
    expect(queryByText('Call Seller')).toBeNull();
    expect(queryByText('Chat / Message')).toBeNull();
  });

  it('increments listing views for non-owners on mount', () => {
    const { services } = require('../../../../../bootstrap');
    mockUseListingDetails.mockReturnValue({
      data: sampleListing,
      isLoading: false,
      error: null,
    } as any);

    render(<ListingDetailsScreen />);
    expect(services.listingService.incrementListingView).toHaveBeenCalledWith('ad-details-100');
  });

  it('fetches real phone number when Call Seller is pressed', async () => {
    const { services } = require('../../../../../bootstrap');
    mockUseListingDetails.mockReturnValue({
      data: sampleListing,
      isLoading: false,
      error: null,
    } as any);

    const { getByText } = render(<ListingDetailsScreen />);
    const callButton = getByText('Call Seller');
    fireEvent.press(callButton);

    expect(services.listingService.getListingPhone).toHaveBeenCalledWith('ad-details-100');
  });
});
