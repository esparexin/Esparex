import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { BusinessRegistrationWizardScreen } from '../BusinessRegistrationWizardScreen';
import { Business, BUSINESS_STATUS } from '@esparex/contracts';

let mockAuthStatus = 'authenticated';
jest.mock('../../../../../providers/AuthProvider', () => ({
  useAuth: () => ({
    status: mockAuthStatus,
    user: { id: 'usr_123', name: 'Shop Owner' },
  }),
}));

jest.mock('../../hooks/useSubmitBusinessRegistration', () => ({
  useSubmitBusinessRegistration: () => ({
    mutate: jest.fn(),
    isPending: false,
  }),
}));

jest.mock('../../hooks/useUpdateBusinessProfile', () => ({
  useUpdateBusinessProfile: () => ({
    mutate: jest.fn(),
    isPending: false,
  }),
}));

jest.mock('expo-device', () => ({
  isDevice: true,
}));

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
}));

jest.mock('expo-constants', () => ({
  expoConfig: { extra: { eas: { projectId: 'test' } } },
}));

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
  MediaTypeOptions: { Images: 'Images' },
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

describe('BusinessRegistrationWizardScreen', () => {
  const mockBusiness: Business = {
    id: 'biz_123',
    sellerId: 'usr_123',
    name: 'Precision Auto Tech',
    status: BUSINESS_STATUS.ACTIVE,
    businessTypes: ['Repair services'],
    mobile: '9876543210',
    email: 'shop@precision.in',
    location: {
      address: 'Shop 42, Tech Park',
      city: 'Hyderabad',
      state: 'Telangana',
      pincode: '500081',
    },
    documents: [],
    trustScore: 95,
    isVerified: true,
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
  };

  beforeEach(() => {
    mockAuthStatus = 'authenticated';
    jest.clearAllMocks();
  });

  it('renders guest barrier when user is anonymous', () => {
    mockAuthStatus = 'anonymous';
    const { getByText } = render(<BusinessRegistrationWizardScreen />);
    expect(getByText('Sign in to register your business')).toBeTruthy();
  });

  it('renders business registration title when creating a new business', () => {
    const { getByText } = render(<BusinessRegistrationWizardScreen />);
    expect(getByText('Business Registration')).toBeTruthy();
    expect(getByText('Step 1 of 4')).toBeTruthy();
  });

  it('renders edit business profile title and pre-fills form in edit mode', () => {
    const { getByText, getByDisplayValue } = render(
      <BusinessRegistrationWizardScreen initialBusiness={mockBusiness} />
    );
    expect(getByText('Edit Business Profile')).toBeTruthy();
    expect(getByDisplayValue('Precision Auto Tech')).toBeTruthy();
  });

  it('calls onCancel when cancel is pressed on the first step', () => {
    const mockCancel = jest.fn();
    const { getByText } = render(
      <BusinessRegistrationWizardScreen onCancel={mockCancel} />
    );
    const cancelButton = getByText('Cancel');
    fireEvent.press(cancelButton);
    expect(mockCancel).toHaveBeenCalledTimes(1);
  });
});
