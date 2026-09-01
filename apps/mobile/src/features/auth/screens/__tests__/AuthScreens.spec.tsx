import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { LoginScreen } from '../LoginScreen';
import { OTPScreen } from '../OTPScreen';
import { useAuth } from '../../../../providers/AuthProvider';
import { navigate } from '../../../../navigation/navigationRef';
import { ROUTES } from '../../../../navigation/routes';
import { useRoute, useNavigation } from '@react-navigation/native';

jest.mock('lucide-react-native', () => {
  const { View } = require('react-native');
  return new Proxy(
    {},
    {
      get: () => View,
    }
  );
});

jest.mock('../../../../providers/AuthProvider');
jest.mock('../../../../navigation/navigationRef');
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useRoute: jest.fn(),
  useNavigation: jest.fn(),
  useNavigationState: jest.fn(),
}));

describe('Auth Stack Screens Verification', () => {
  const mockSendOtp = jest.fn();
  const mockVerifyOtp = jest.fn();
  const mockCancelOtp = jest.fn();
  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
    canGoBack: jest.fn().mockReturnValue(true),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      sendOtp: mockSendOtp,
      verifyOtp: mockVerifyOtp,
      cancelOtp: mockCancelOtp,
    });
    (useNavigation as jest.Mock).mockReturnValue(mockNavigation);
    (useRoute as jest.Mock).mockReturnValue({
      params: { mobile: '9876543210', isNewUser: false },
    });
  });

  describe('LoginScreen', () => {
    it('disables "Send OTP" button until exactly 10 digits are entered', () => {
      const { getByLabelText } = render(<LoginScreen />);
      const mobileInput = getByLabelText('Mobile Number');
      const sendOtpButton = getByLabelText('Send OTP Button');

      // Initially empty -> button disabled
      fireEvent.changeText(mobileInput, '98765');
      expect(sendOtpButton.props.accessibilityState?.disabled).toBe(true);

      // 10 digits entered -> button enabled
      fireEvent.changeText(mobileInput, '9876543210');
      expect(sendOtpButton.props.accessibilityState?.disabled).toBe(false);
    });

    it('navigates to Terms & Privacy when footer link is pressed', () => {
      const { getByLabelText } = render(<LoginScreen />);
      const termsLink = getByLabelText('View terms of service');

      fireEvent.press(termsLink);
      expect(navigate).toHaveBeenCalledWith(ROUTES.AUTH_STACK, {
        screen: ROUTES.TERMS_AND_PRIVACY,
      });
    });

    it('submits sendOtp and navigates to OTP screen on success', async () => {
      mockSendOtp.mockResolvedValueOnce({ success: true, isNewUser: false });
      const { getByLabelText, getByText } = render(<LoginScreen />);
      const mobileInput = getByLabelText('Mobile Number');
      const sendOtpButton = getByText('Send OTP');

      fireEvent.changeText(mobileInput, '9876543210');
      fireEvent.press(sendOtpButton);

      await waitFor(() => {
        expect(mockSendOtp).toHaveBeenCalledWith('9876543210');
        expect(navigate).toHaveBeenCalledWith(ROUTES.AUTH_STACK, {
          screen: ROUTES.OTP,
          params: {
            mobile: '9876543210',
            isNewUser: false,
            name: undefined,
          },
        });
      });
    });
  });

  describe('OTPScreen', () => {
    it('renders 6-digit segmented OTP input and submits on valid 6-digit code', async () => {
      mockVerifyOtp.mockResolvedValueOnce({});
      const { getByLabelText, getByText, UNSAFE_getByType } = render(<OTPScreen />);

      const textInput = UNSAFE_getByType('TextInput' as any);
      fireEvent.changeText(textInput, '123456');

      const verifyButton = getByText('Verify & Sign In');
      fireEvent.press(verifyButton);

      await waitFor(() => {
        expect(mockVerifyOtp).toHaveBeenCalledWith('9876543210', '123456', undefined);
      });
    });

    it('calls cancelOtp and navigates back to Login when "Wrong number? Change" is pressed', () => {
      const { getByLabelText } = render(<OTPScreen />);
      const changeNumberButton = getByLabelText('Change mobile number');

      fireEvent.press(changeNumberButton);
      expect(mockCancelOtp).toHaveBeenCalledWith('9876543210');
      expect(navigate).toHaveBeenCalledWith(ROUTES.AUTH_STACK, {
        screen: ROUTES.LOGIN,
      });
    });
  });
});
