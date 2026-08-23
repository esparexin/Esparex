import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

jest.mock('lucide-react-native', () => {
  const { View } = require('react-native');
  return new Proxy(
    {},
    {
      get: () => View,
    }
  );
});

import { ListingCard } from '../ListingCard';
import { Listing } from '../../../domain/Listing';

describe('ListingCard Component Performance & Memoization', () => {
  const sampleListing: Listing = {
    id: 'ad-memo-1',
    title: 'Samsung Galaxy S23 Ultra',
    description: '256GB Phantom Black',
    price: { amount: 75000, currency: 'INR', formatted: '₹75,000' },
    seller: { id: 'usr-2', name: 'Mobile Hub', type: 'business', isVerified: true },
    images: [{ url: 'https://storage.esparex.in/s23.jpg', isPrimary: true }],
    status: 'live',
    createdAt: new Date(),
    isFeatured: true,
    isSpotlight: false,
    isPremium: false,
  };

  it('renders memoized listing card component correctly', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(<ListingCard listing={sampleListing} onPress={onPressMock} />);

    expect(getByText('Samsung Galaxy S23 Ultra')).toBeTruthy();
    expect(getByText('₹75,000')).toBeTruthy();
    expect(getByText('Featured')).toBeTruthy();
  });

  it('renders Spotlight badge when isSpotlight is true', () => {
    const spotlightListing: Listing = {
      ...sampleListing,
      id: 'ad-memo-2',
      isSpotlight: true,
    };
    const onPressMock = jest.fn();
    const { getByText } = render(<ListingCard listing={spotlightListing} onPress={onPressMock} />);

    expect(getByText('Spotlight')).toBeTruthy();
  });

  it('renders Heart favorite button and invokes onToggleSave when tapped', () => {
    const onPressMock = jest.fn();
    const onToggleSaveMock = jest.fn();
    const { getByLabelText } = render(
      <ListingCard
        listing={sampleListing}
        onPress={onPressMock}
        isSaved={false}
        onToggleSave={onToggleSaveMock}
      />
    );

    const heartBtn = getByLabelText('Save Samsung Galaxy S23 Ultra');
    expect(heartBtn).toBeTruthy();
    fireEvent.press(heartBtn);
    expect(onToggleSaveMock).toHaveBeenCalledWith('ad-memo-1');
  });

  it('renders correct accessibility label when isSaved is true', () => {
    const onPressMock = jest.fn();
    const onToggleSaveMock = jest.fn();
    const { getByLabelText } = render(
      <ListingCard
        listing={sampleListing}
        onPress={onPressMock}
        isSaved={true}
        onToggleSave={onToggleSaveMock}
      />
    );

    expect(getByLabelText('Remove Samsung Galaxy S23 Ultra from saved')).toBeTruthy();
  });
});
