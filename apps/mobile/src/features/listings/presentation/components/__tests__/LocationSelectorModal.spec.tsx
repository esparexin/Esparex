import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { LocationSelectorModal } from '../LocationSelectorModal';

const mockSearchLocations = jest.fn();
const mockDetectLocation = jest.fn();

jest.mock('../../../../../bootstrap', () => ({
  services: {
    locationService: {
      searchLocations: (...args: unknown[]) => mockSearchLocations(...args),
      detectLocation: (...args: unknown[]) => mockDetectLocation(...args),
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

describe('LocationSelectorModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSelectLocation = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders modal with All India, Detect my location, and search input', () => {
    const { getByText, getByPlaceholderText } = render(
      <LocationSelectorModal
        visible={true}
        onClose={mockOnClose}
        onSelectLocation={mockOnSelectLocation}
      />
    );

    expect(getByText('Select Location')).toBeTruthy();
    expect(getByText('All India')).toBeTruthy();
    expect(getByText('Detect my location')).toBeTruthy();
    expect(getByPlaceholderText('Search city, area or state…')).toBeTruthy();
  });

  it('calls onSelectLocation(null) when All India is pressed', () => {
    const { getByText } = render(
      <LocationSelectorModal
        visible={true}
        onClose={mockOnClose}
        onSelectLocation={mockOnSelectLocation}
      />
    );

    fireEvent.press(getByText('All India'));
    expect(mockOnSelectLocation).toHaveBeenCalledWith(null);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calls locationService.detectLocation and selects detected location when Detect my location is pressed', async () => {
    mockDetectLocation.mockResolvedValueOnce({
      locationId: 'loc-hyd',
      name: 'Hyderabad',
      city: 'Hyderabad',
      state: 'Telangana',
      display: 'Hyderabad, Telangana',
    });

    const { getByText } = render(
      <LocationSelectorModal
        visible={true}
        onClose={mockOnClose}
        onSelectLocation={mockOnSelectLocation}
      />
    );

    fireEvent.press(getByText('Detect my location'));

    await waitFor(() => {
      expect(mockDetectLocation).toHaveBeenCalled();
      expect(mockOnSelectLocation).toHaveBeenCalledWith(
        expect.objectContaining({
          locationId: 'loc-hyd',
          city: 'Hyderabad',
        })
      );
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('searches locations when user types a query', async () => {
    mockSearchLocations.mockResolvedValueOnce([
      {
        locationId: 'loc-mumbai',
        name: 'Mumbai',
        city: 'Mumbai',
        state: 'Maharashtra',
        display: 'Mumbai, Maharashtra',
      },
    ]);

    const { getByPlaceholderText, getByText } = render(
      <LocationSelectorModal
        visible={true}
        onClose={mockOnClose}
        onSelectLocation={mockOnSelectLocation}
      />
    );

    const input = getByPlaceholderText('Search city, area or state…');
    fireEvent.changeText(input, 'Mumbai');

    await waitFor(() => {
      expect(mockSearchLocations).toHaveBeenCalledWith('Mumbai');
      expect(getByText('Mumbai, Maharashtra')).toBeTruthy();
    });

    fireEvent.press(getByText('Mumbai, Maharashtra'));
    expect(mockOnSelectLocation).toHaveBeenCalledWith(
      expect.objectContaining({
        locationId: 'loc-mumbai',
      })
    );
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('renders popular metro city chips and selects a city when pressed', () => {
    const { getByText, getByLabelText } = render(
      <LocationSelectorModal
        visible={true}
        onClose={mockOnClose}
        onSelectLocation={mockOnSelectLocation}
      />
    );

    expect(getByText('Popular Cities')).toBeTruthy();
    expect(getByText('Hyderabad')).toBeTruthy();
    expect(getByText('Bengaluru')).toBeTruthy();

    const hyderabadChip = getByLabelText('Select Hyderabad, Telangana');
    fireEvent.press(hyderabadChip);

    expect(mockOnSelectLocation).toHaveBeenCalledWith(
      expect.objectContaining({
        city: 'Hyderabad',
        state: 'Telangana',
      })
    );
    expect(mockOnClose).toHaveBeenCalled();
  });
});
