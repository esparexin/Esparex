import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';

jest.mock('../../../../../bootstrap', () => ({
  services: {
    listingService: {
      getListingDetails: jest.fn(),
      updateListing: jest.fn(),
    },
  },
}));

const mockGoBack = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useRoute: () => ({
    params: { id: 'ad-edit-100' },
  }),
  useNavigation: () => ({
    goBack: mockGoBack,
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

const mockMutateAsync = jest.fn();
jest.mock('../../hooks/useListingDetails');
jest.mock('../../hooks/useUpdateListing', () => ({
  useUpdateListing: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
}));

import { EditListingScreen } from '../EditListingScreen';
import { useListingDetails } from '../../hooks/useListingDetails';
import { Listing } from '../../../domain/Listing';

const mockUseListingDetails = useListingDetails as jest.MockedFunction<typeof useListingDetails>;

describe('EditListingScreen', () => {
  const sampleListing: Listing = {
    id: 'ad-edit-100',
    title: 'MacBook Pro M2',
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
    jest.spyOn(Alert, 'alert');
  });

  it('renders loading activity indicator when listing query is pending', () => {
    mockUseListingDetails.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as any);

    const { queryByText } = render(<EditListingScreen />);
    expect(queryByText('Edit Listing')).toBeNull();
  });

  it('pre-populates title, price amount, and description correctly', () => {
    mockUseListingDetails.mockReturnValue({
      data: sampleListing,
      isLoading: false,
      error: null,
    } as any);

    const { getByDisplayValue } = render(<EditListingScreen />);
    expect(getByDisplayValue('MacBook Pro M2')).toBeTruthy();
    expect(getByDisplayValue('145000')).toBeTruthy();
    expect(getByDisplayValue('16GB RAM 512GB SSD Space Gray')).toBeTruthy();
  });

  it('submits updated values when Save Changes is pressed', async () => {
    mockUseListingDetails.mockReturnValue({
      data: sampleListing,
      isLoading: false,
      error: null,
    } as any);
    mockMutateAsync.mockResolvedValueOnce({ ...sampleListing, title: 'MacBook Pro M2 16"' });

    const { getByDisplayValue, getByText } = render(<EditListingScreen />);
    const titleInput = getByDisplayValue('MacBook Pro M2');
    fireEvent.changeText(titleInput, 'MacBook Pro M2 16"');

    const saveButton = getByText('Save Changes');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        id: 'ad-edit-100',
        updates: {
          title: 'MacBook Pro M2 16"',
          price: 145000,
          description: '16GB RAM 512GB SSD Space Gray',
        },
      });
    });
  });
});
