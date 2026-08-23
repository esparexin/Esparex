import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { SafetyTipsSection } from '../SafetyTipsSection';

jest.mock('lucide-react-native', () => {
  const { View } = require('react-native');
  return new Proxy(
    {},
    {
      get: () => View,
    }
  );
});

describe('SafetyTipsSection', () => {
  it('renders Safety First title, formatted ID, and tips', () => {
    const onReportPress = jest.fn();
    const { getByText } = render(
      <SafetyTipsSection adId="60d5ec49f1b2c8a1e4a1b2c3" onReportPress={onReportPress} />
    );

    expect(getByText('Safety First')).toBeTruthy();
    expect(getByText('#E4A1B2C3')).toBeTruthy();
    expect(getByText(/Inspect in person/)).toBeTruthy();
    expect(getByText(/No advance payments/)).toBeTruthy();
    expect(getByText(/Report fraud/)).toBeTruthy();

    const reportButton = getByText('Report this listing');
    fireEvent.press(reportButton);
    expect(onReportPress).toHaveBeenCalledTimes(1);
  });
});
