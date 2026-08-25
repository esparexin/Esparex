import React from 'react';
import { render } from '@testing-library/react-native';
import { AvailableSparePartsSection } from '../AvailableSparePartsSection';

jest.mock('lucide-react-native', () => {
  const { View } = require('react-native');
  return new Proxy(
    {},
    {
      get: () => View,
    }
  );
});

describe('AvailableSparePartsSection', () => {
  it('renders nothing when spareParts is undefined or empty', () => {
    const { toJSON } = render(<AvailableSparePartsSection spareParts={undefined} />);
    expect(toJSON()).toBeNull();

    const { toJSON: toJSON2 } = render(<AvailableSparePartsSection spareParts={[]} />);
    expect(toJSON2()).toBeNull();
  });

  it('renders working spare parts chips', () => {
    const parts = [
      { id: 'part-1', name: 'Original Display Panel' },
      { id: 'part-2', name: 'Motherboard (Intel i5)' },
    ];

    const { getByText } = render(<AvailableSparePartsSection spareParts={parts} />);
    expect(getByText('Available Spare Parts')).toBeTruthy();
    expect(getByText('Original Display Panel')).toBeTruthy();
    expect(getByText('Motherboard (Intel i5)')).toBeTruthy();
  });
});
