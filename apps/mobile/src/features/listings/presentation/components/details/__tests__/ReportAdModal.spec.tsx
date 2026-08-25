import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { ReportAdModal } from '../ReportAdModal';
import { services } from '../../../../../../bootstrap';

jest.mock('../../../../../../bootstrap', () => ({
  services: {
    listingService: {
      reportListing: jest.fn().mockResolvedValue(undefined),
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

describe('ReportAdModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders reasons and submits report when reason selected', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    const onClose = jest.fn();

    const { getByText } = render(
      <ReportAdModal
        visible={true}
        adId="ad-100"
        adTitle="MacBook Pro"
        onClose={onClose}
      />
    );

    expect(getByText('Report Listing')).toBeTruthy();
    expect(getByText('Fraudulent or Scam')).toBeTruthy();

    fireEvent.press(getByText('Fraudulent or Scam'));
    fireEvent.press(getByText('Submit Report'));

    await waitFor(() => {
      expect(services.listingService.reportListing).toHaveBeenCalledWith(
        'ad-100',
        'SCAM',
        undefined
      );
      expect(alertSpy).toHaveBeenCalledWith(
        'Report Submitted',
        'Thank you. Our moderation team will review this listing.',
        expect.any(Array)
      );
    });
  });
});
