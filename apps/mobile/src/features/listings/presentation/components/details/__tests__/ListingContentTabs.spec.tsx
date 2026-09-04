import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ListingContentTabs } from '../ListingContentTabs';
import { ListingSparePart } from '../../../../domain/Listing';

jest.mock('../../../hooks/useNearbyBusinesses', () => ({
  useNearbyBusinesses: jest.fn().mockReturnValue({
    data: [
      {
        id: 'biz-1',
        name: 'iFixit Bengaluru',
        businessName: 'iFixit Bengaluru',
        sellerId: 's-1',
        mobile: '9876543210',
        businessTypes: ['repair_center'],
        location: { city: 'Bengaluru', display: 'Koramangala, Bengaluru' },
        documents: [],
        status: 'live',
        trustScore: 95,
        isVerified: true,
        createdAt: new Date().toISOString(),
      },
    ],
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

describe('ListingContentTabs', () => {
  const sampleSpareParts: ListingSparePart[] = [
    { id: 'part-1', name: 'Original Retina Display' },
    { id: 'part-2', name: 'Battery (95% Health)' },
  ];

  it('renders all 3 tab headers and defaults to "Repair Shops"', () => {
    const { getByText, getByLabelText } = render(
      <ListingContentTabs
        description="Mint condition laptop"
        spareParts={sampleSpareParts}
        locationId="loc-1"
        listingCategoryId="cat-1"
      />
    );

    expect(getByText('Repair Shops')).toBeTruthy();
    expect(getByText('Description')).toBeTruthy();
    expect(getByText('Spare Parts')).toBeTruthy();

    // Default tab is "Repair Shops"
    const repairShopsTab = getByLabelText('Repair Shops');
    expect(repairShopsTab.props.accessibilityState).toEqual({ selected: true });

    // Nearby repair business is rendered
    expect(getByText('iFixit Bengaluru')).toBeTruthy();
  });

  it('displays the spare parts count badge when spare parts exist', () => {
    const { getByText, getByLabelText } = render(
      <ListingContentTabs
        description="Mint condition laptop"
        spareParts={sampleSpareParts}
      />
    );

    expect(getByText('2')).toBeTruthy();
    const sparePartsTab = getByLabelText('Spare Parts (2 items)');
    expect(sparePartsTab.props.accessibilityState).toEqual({ selected: false });
  });

  it('switches to Description tab and invokes onTabChange callback', () => {
    const onTabChangeMock = jest.fn();
    const { getByLabelText, getByText, queryByText } = render(
      <ListingContentTabs
        description="Super clean laptop with charger"
        spareParts={sampleSpareParts}
        onTabChange={onTabChangeMock}
      />
    );

    const descTab = getByLabelText('Description');
    fireEvent.press(descTab);

    expect(onTabChangeMock).toHaveBeenCalledWith('description');
    expect(descTab.props.accessibilityState).toEqual({ selected: true });
    expect(getByText('Super clean laptop with charger')).toBeTruthy();
    // Repair shops content is no longer in the panel
    expect(queryByText('iFixit Bengaluru')).toBeNull();
  });

  it('switches to Spare Parts tab and displays available spare parts', () => {
    const onTabChangeMock = jest.fn();
    const { getByLabelText, getByText } = render(
      <ListingContentTabs
        description="Super clean laptop"
        spareParts={sampleSpareParts}
        onTabChange={onTabChangeMock}
      />
    );

    const sparePartsTab = getByLabelText('Spare Parts (2 items)');
    fireEvent.press(sparePartsTab);

    expect(onTabChangeMock).toHaveBeenCalledWith('spare-parts');
    expect(sparePartsTab.props.accessibilityState).toEqual({ selected: true });
    expect(getByText('Original Retina Display')).toBeTruthy();
    expect(getByText('Battery (95% Health)')).toBeTruthy();
  });
});
