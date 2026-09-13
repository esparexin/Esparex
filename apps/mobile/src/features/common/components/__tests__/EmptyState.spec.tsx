import React from 'react';
import { render } from '@testing-library/react-native';
import { EmptyState } from '../EmptyState';

jest.mock('lucide-react-native', () => {
  const { View } = require('react-native');
  return new Proxy(
    {},
    {
      get: () => View,
    }
  );
});

describe('EmptyState', () => {
  it('renders title and description properly', () => {
    const { getByText } = render(
      <EmptyState
        title="No Results Found"
        description="Try searching with different keywords."
      />
    );

    expect(getByText('No Results Found')).toBeTruthy();
    expect(getByText('Try searching with different keywords.')).toBeTruthy();
  });

  it('renders with custom icon prop without crashing', () => {
    const { getByText } = render(
      <EmptyState
        title="No Saved Items"
        description="You have not saved any items yet."
        icon="Heart"
      />
    );

    expect(getByText('No Saved Items')).toBeTruthy();
    expect(getByText('You have not saved any items yet.')).toBeTruthy();
  });
});
