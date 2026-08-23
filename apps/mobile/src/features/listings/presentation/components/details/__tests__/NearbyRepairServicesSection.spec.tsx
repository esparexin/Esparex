import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Linking } from 'react-native';
import { useNearbyBusinesses } from '../../../hooks/useNearbyBusinesses';
import { NearbyRepairServicesSection } from '../NearbyRepairServicesSection';
import { Business } from '@esparex/contracts';

jest.mock('../../../hooks/useNearbyBusinesses', () => ({
  useNearbyBusinesses: jest.fn(),
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

const mockUseNearbyBusinesses = useNearbyBusinesses as jest.MockedFunction<typeof useNearbyBusinesses>;

describe('NearbyRepairServicesSection', () => {
  const sampleBusinesses: Business[] = [
    {
      id: 'biz-1',
      name: 'QuickFix Electronics',
      sellerId: 'usr-1',
      mobile: '9876543210',
      email: 'quickfix@example.com',
      businessTypes: ['repair_center'],
      location: {
        address: '12 Main Street',
        city: 'Indiranagar',
        state: 'Karnataka',
        display: 'Indiranagar, Bengaluru',
      },
      documents: [] as any,
      status: 'live' as any,
      trustScore: 90,
      isVerified: true,
      createdAt: new Date().toISOString(),
      distanceKm: 1.5,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing when there are no businesses or when loading', () => {
    mockUseNearbyBusinesses.mockReturnValue({
      data: [],
      isLoading: true,
    } as any);

    const { queryByText } = render(
      <NearbyRepairServicesSection category="Laptops" city="Bengaluru" />
    );
    expect(queryByText('Nearby Repair Services')).toBeNull();
  });

  it('renders nearby repair centers with verification and call action', () => {
    mockUseNearbyBusinesses.mockReturnValue({
      data: sampleBusinesses,
      isLoading: false,
    } as any);

    const openUrlSpy = jest.spyOn(Linking, 'openURL').mockImplementation(() => Promise.resolve());

    const { getByText } = render(
      <NearbyRepairServicesSection category="Laptops" city="Bengaluru" />
    );

    expect(getByText('Nearby Repair Services')).toBeTruthy();
    expect(getByText('QuickFix Electronics')).toBeTruthy();
    expect(getByText('Verified')).toBeTruthy();

    const callButton = getByText('Call Center');
    fireEvent.press(callButton);
    expect(openUrlSpy).toHaveBeenCalledWith('tel:9876543210');
  });
});
