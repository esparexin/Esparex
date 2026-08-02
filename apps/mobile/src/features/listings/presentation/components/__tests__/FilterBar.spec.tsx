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

import { FilterBar } from '../FilterBar';

describe('FilterBar Component', () => {
  it('renders filter button and active filter count badge', () => {
    const { getByText } = render(
      <FilterBar
        filters={{ sortBy: 'newest', condition: 'used_good' }}
        activeFilterCount={2}
        onOpenFilterModal={jest.fn()}
        onClearFilters={jest.fn()}
      />
    );

    expect(getByText('Filters')).toBeTruthy();
    expect(getByText('2')).toBeTruthy();
    expect(getByText('Sort: newest')).toBeTruthy();
    expect(getByText('Condition: used_good')).toBeTruthy();
  });

  it('triggers onOpenFilterModal when Filters button is pressed', () => {
    const mockOpen = jest.fn();
    const { getByText } = render(
      <FilterBar
        filters={{}}
        activeFilterCount={0}
        onOpenFilterModal={mockOpen}
        onClearFilters={jest.fn()}
      />
    );

    fireEvent.press(getByText('Filters'));
    expect(mockOpen).toHaveBeenCalledTimes(1);
  });

  it('triggers chip remove handlers when X icon is pressed', () => {
    const mockRemoveSort = jest.fn();
    const { getByText } = render(
      <FilterBar
        filters={{ sortBy: 'price-low' }}
        activeFilterCount={1}
        onOpenFilterModal={jest.fn()}
        onClearFilters={jest.fn()}
        onRemoveSort={mockRemoveSort}
      />
    );

    fireEvent.press(getByText('Sort: price-low'));
    expect(mockRemoveSort).toHaveBeenCalledTimes(1);
  });
});
