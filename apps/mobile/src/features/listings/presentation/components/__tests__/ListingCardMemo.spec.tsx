import React from 'react';
import { render } from '@testing-library/react-native';

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
    isPremium: false,
  };

  it('renders memoized listing card component correctly', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(<ListingCard listing={sampleListing} onPress={onPressMock} />);

    expect(getByText('Samsung Galaxy S23 Ultra')).toBeTruthy();
    expect(getByText('₹75,000')).toBeTruthy();
    expect(getByText('Mobile Hub')).toBeTruthy();
  });
});
