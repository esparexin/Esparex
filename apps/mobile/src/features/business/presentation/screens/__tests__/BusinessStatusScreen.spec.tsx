import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { BusinessStatusScreen } from '../BusinessStatusScreen';
import { BUSINESS_STATUS, Business } from '@esparex/contracts';

jest.mock('lucide-react-native', () => {
  const { View } = require('react-native');
  return new Proxy(
    {},
    {
      get: () => View,
    }
  );
});

describe('BusinessStatusScreen Component', () => {
  const mockBusiness: Business = {
    id: 'biz_123',
    sellerId: 'usr_123',
    name: 'Precision Parts Hub',
    status: BUSINESS_STATUS.PENDING,
    businessTypes: ['REPAIR_SHOP'],
    mobile: '+919876543210',
    email: 'shop@precision.in',
    location: {
      address: '123 Tech Lane',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
    },
    documents: [],
    trustScore: 100,
    isVerified: false,
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
  };

  it('renders pending status card with business name', () => {
    const { getByText } = render(<BusinessStatusScreen business={mockBusiness} />);
    expect(getByText('Precision Parts Hub')).toBeTruthy();
    expect(getByText(/Verification Pending/)).toBeTruthy();
  });

  it('calls onBack when back arrow is pressed', () => {
    const mockBack = jest.fn();
    const { getByLabelText } = render(
      <BusinessStatusScreen business={mockBusiness} onBack={mockBack} />
    );
    const backButton = getByLabelText('Back to profile');
    fireEvent.press(backButton);
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it('renders verified business badge for live businesses', () => {
    const liveBusiness = { ...mockBusiness, status: BUSINESS_STATUS.LIVE };
    const { getByText } = render(<BusinessStatusScreen business={liveBusiness} />);
    expect(getByText(/Verified Business/)).toBeTruthy();
  });

  it('renders update application button and calls onEdit for rejected applications', () => {
    const mockEdit = jest.fn();
    const rejectedBusiness = {
      ...mockBusiness,
      status: BUSINESS_STATUS.REJECTED,
      rejectionReason: 'Invalid GST document',
    };
    const { getByText } = render(
      <BusinessStatusScreen business={rejectedBusiness} onEdit={mockEdit} />
    );
    expect(getByText(/Application Rejected/)).toBeTruthy();
    expect(getByText('Invalid GST document')).toBeTruthy();

    const updateButton = getByText('Update Application');
    fireEvent.press(updateButton);
    expect(mockEdit).toHaveBeenCalledTimes(1);
  });
});
