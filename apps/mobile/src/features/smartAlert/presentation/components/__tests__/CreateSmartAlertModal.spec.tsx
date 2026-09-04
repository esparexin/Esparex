import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CreateSmartAlertModal } from '../CreateSmartAlertModal';
import { services } from '../../../../../bootstrap';

jest.mock('../../../../../bootstrap', () => ({
  services: {
    smartAlertService: {
      createSmartAlert: jest.fn(),
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

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('CreateSmartAlertModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders modal sheet with title and input fields', () => {
    const onClose = jest.fn();
    const { getByText, getByPlaceholderText } = render(
      <CreateSmartAlertModal visible={true} onClose={onClose} />,
      { wrapper: createWrapper() }
    );

    expect(getByText('Create Smart Alert')).toBeTruthy();
    expect(getByPlaceholderText('e.g. iPhone 13 in Mumbai')).toBeTruthy();
    expect(getByPlaceholderText('e.g. OLED TV, Royal Enfield')).toBeTruthy();
    expect(getByPlaceholderText('e.g. Mobile Phones, Electronics')).toBeTruthy();
    expect(getByPlaceholderText('Min')).toBeTruthy();
    expect(getByPlaceholderText('Max')).toBeTruthy();
    expect(getByPlaceholderText('e.g. Mumbai, New Delhi')).toBeTruthy();
  });

  it('validates that at least one field is filled', () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    const onClose = jest.fn();

    const { getByText } = render(
      <CreateSmartAlertModal visible={true} onClose={onClose} />,
      { wrapper: createWrapper() }
    );

    fireEvent.press(getByText('Save Smart Alert'));

    expect(alertSpy).toHaveBeenCalledWith(
      'Validation Error',
      'Please specify an alert name, search keyword, or category.'
    );
  });

  it('validates price range when maxPrice < minPrice', () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    const onClose = jest.fn();

    const { getByText, getByPlaceholderText } = render(
      <CreateSmartAlertModal visible={true} onClose={onClose} />,
      { wrapper: createWrapper() }
    );

    fireEvent.changeText(getByPlaceholderText('e.g. iPhone 13 in Mumbai'), 'iPhone Alert');
    fireEvent.changeText(getByPlaceholderText('Min'), '1000');
    fireEvent.changeText(getByPlaceholderText('Max'), '500');

    fireEvent.press(getByText('Save Smart Alert'));

    expect(alertSpy).toHaveBeenCalledWith(
      'Validation Error',
      'Maximum price must be greater than or equal to minimum price.'
    );
  });

  it('submits successfully and calls onClose on success', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    const onClose = jest.fn();
    (services.smartAlertService.createSmartAlert as jest.Mock).mockResolvedValue({
      id: 'alert-1',
      name: 'iPhone 13',
    });

    const { getByText, getByPlaceholderText } = render(
      <CreateSmartAlertModal visible={true} onClose={onClose} />,
      { wrapper: createWrapper() }
    );

    fireEvent.changeText(getByPlaceholderText('e.g. iPhone 13 in Mumbai'), 'iPhone 13');
    fireEvent.press(getByText('Save Smart Alert'));

    await waitFor(() => {
      expect(services.smartAlertService.createSmartAlert).toHaveBeenCalled();
      expect(alertSpy).toHaveBeenCalledWith(
        'Smart Alert Created',
        'You will receive instant push notifications when matching ads are posted.'
      );
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('pre-fills fields when initialAlert is provided', () => {
    const onClose = jest.fn();
    const initialAlert = {
      id: 'alert-existing',
      name: 'MacBook M2',
      criteria: {
        keywords: 'macbook m2',
        category: 'Laptops',
        minPrice: 50000,
        maxPrice: 80000,
        location: 'Bengaluru',
      },
      radiusKm: 25,
      frequency: 'instant' as const,
      createdAt: '2025-01-01',
    };

    const { getByText, getByDisplayValue } = render(
      <CreateSmartAlertModal
        visible={true}
        onClose={onClose}
        initialAlert={initialAlert}
      />,
      { wrapper: createWrapper() }
    );

    expect(getByText('Edit Smart Alert')).toBeTruthy();
    expect(getByDisplayValue('MacBook M2')).toBeTruthy();
    expect(getByDisplayValue('macbook m2')).toBeTruthy();
    expect(getByDisplayValue('Laptops')).toBeTruthy();
    expect(getByDisplayValue('50000')).toBeTruthy();
    expect(getByDisplayValue('80000')).toBeTruthy();
    expect(getByDisplayValue('Bengaluru')).toBeTruthy();
  });
});
