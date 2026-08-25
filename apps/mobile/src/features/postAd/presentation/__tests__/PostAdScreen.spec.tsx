import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { PostAdScreen } from '../PostAdScreen';
import { PostAdProvider } from '../../PostAdProvider';
import { services } from '../../../../bootstrap';

jest.mock('../../../../bootstrap', () => ({
  services: {
    categoryService: {
      getCategories: jest.fn().mockResolvedValue([
        { id: 'cat-1', name: 'Laptops', icon: 'Laptop' },
        { id: 'cat-2', name: 'Smartphones', icon: 'Smartphone' },
      ]),
    },
    locationService: {
      searchLocations: jest.fn().mockResolvedValue([]),
      detectLocation: jest.fn().mockResolvedValue({
        locationId: 'loc-1',
        city: 'Bengaluru',
        state: 'Karnataka',
        display: 'Indiranagar, Bengaluru',
        coordinates: [77.5946, 12.9716],
      }),
    },
    imagePicker: {
      pick: jest.fn().mockResolvedValue({
        success: true,
        images: [{ uri: 'file:///photo1.jpg', mimeType: 'image/jpeg', name: 'photo1.jpg' }],
      }),
    },
    postAdService: {
      submit: jest.fn().mockResolvedValue({ success: true, listingId: 'ad-created-1' }),
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

jest.mock('../../../../providers/AuthProvider', () => ({
  useAuth: () => ({ status: 'authenticated', user: { id: 'usr-1' } }),
}));

describe('PostAdScreen (3-Step Wizard)', () => {
  it('renders Step 1 (Category selection) initially', async () => {
    const { getByText, findByText } = render(
      <PostAdProvider>
        <PostAdScreen />
      </PostAdProvider>
    );

    expect(await findByText('Select Category')).toBeTruthy();
    expect(getByText('Laptops')).toBeTruthy();
    expect(getByText('Smartphones')).toBeTruthy();
  });
});
