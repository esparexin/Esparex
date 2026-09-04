import React, { useState } from 'react';
import { View } from 'react-native';
import { AppInput, AppButton, AppText } from '@esparex/mobile-ui';
import { AuthLayout } from '../layouts/AuthLayout';
import { useAuth } from '../../../providers/AuthProvider';
import { navigate } from '../../../navigation/navigationRef';
import { ROUTES } from '../../../navigation/routes';

export const LoginScreen = () => {
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { sendOtp } = useAuth();

  const handleMobileChange = (text: string) => {
    const digitsOnly = text.replace(/\D/g, '').slice(0, 10);
    setMobile(digitsOnly);
    if (error) setError(null);
  };

  const handleSendOtp = async () => {
    if (mobile.length !== 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await sendOtp(mobile);
      if (res.success) {
        navigate(ROUTES.AUTH_STACK, {
          screen: ROUTES.OTP,
          params: {
            mobile,
            isNewUser: res.isNewUser,
            name: res.name,
          },
        });
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string; message?: string; details?: { lockUntil?: string } }; status?: number } };
      const apiError = axiosErr?.response?.data?.error || axiosErr?.response?.data?.message;
      const status = axiosErr?.response?.status;

      if (status === 423) {
        setError('Account temporarily locked due to failed attempts. Please try again later.');
      } else if (status === 429) {
        setError('Too many OTP requests. Please wait a few minutes before trying again.');
      } else if (apiError) {
        setError(apiError);
      } else {
        setError('Unable to send OTP. Please check your internet connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome to Esparex"
      description="Login or register with your 10-digit mobile number"
      footer={
        <View className="px-4 flex-row flex-wrap justify-center items-center">
          <AppText variant="caption" className="text-foreground-subtle">
            By continuing, you agree to Esparex{' '}
            <AppText
              variant="caption"
              className="text-brand-600 dark:text-brand-400 font-semibold underline"
              onPress={() => navigate(ROUTES.AUTH_STACK, { screen: ROUTES.TERMS_AND_PRIVACY })}
              accessibilityRole="link"
              accessibilityLabel="View terms of service"
            >
              Terms of Service
            </AppText>
            {' '}&amp;{' '}
            <AppText
              variant="caption"
              className="text-brand-600 dark:text-brand-400 font-semibold underline"
              onPress={() => navigate(ROUTES.AUTH_STACK, { screen: ROUTES.TERMS_AND_PRIVACY })}
              accessibilityRole="link"
              accessibilityLabel="View privacy policy"
            >
              Privacy Policy
            </AppText>
            .
          </AppText>
        </View>
      }
    >
      <AppInput
        label="Mobile Number"
        placeholder="Enter 10-digit number"
        value={mobile}
        onChangeText={handleMobileChange}
        keyboardType="phone-pad"
        maxLength={10}
        error={error || undefined}
        leftIcon={
          <AppText variant="body" className="font-semibold text-slate-700 dark:text-slate-300">
            +91
          </AppText>
        }
        accessibilityLabel="Mobile Number"
        accessibilityHint="Enter your 10-digit Indian mobile number"
      />
      
      <AppButton
        label="Send OTP"
        onPress={handleSendOtp}
        loading={loading}
        className="mt-4"
        disabled={mobile.length !== 10 || loading}
        accessibilityLabel="Send OTP Button"
      />
    </AuthLayout>
  );
};
