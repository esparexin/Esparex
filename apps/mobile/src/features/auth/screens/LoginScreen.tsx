import React, { useState } from 'react';
import { TouchableOpacity } from 'react-native';
import { AppInput, AppButton, AppText } from '@esparex/mobile-ui';
import { AuthLayout } from '../layouts/AuthLayout';
import { useAuth } from '../../../providers/AuthProvider';
import { navigate } from '../../../navigation/navigationRef';
import { ROUTES } from '../../../navigation/routes';

export const LoginScreen = () => {
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);
  const { sendOtp } = useAuth();

  const handleLogin = async () => {
    if (mobile.length !== 10) return;
    setLoading(true);
    try {
      const res = await sendOtp(mobile);
      if (res.success) {
        navigate(ROUTES.AUTH_STACK, { screen: ROUTES.OTP, params: { mobile } });
      }
    } catch {
      // Errors handled by service/interceptor
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome to Esparex"
      description="Login to buy & sell mobile spares"
      footer={
        <TouchableOpacity
          onPress={() => navigate(ROUTES.AUTH_STACK, { screen: ROUTES.SIGNUP })}
          accessibilityRole="button"
          accessibilityLabel="Don't have an account? Sign up"
        >
          <AppText variant="body" className="text-slate-500">
            Don&apos;t have an account? <AppText className="text-brand-600 dark:text-brand-400 font-semibold">Sign up</AppText>
          </AppText>
        </TouchableOpacity>
      }
    >
      <AppInput
        label="Mobile Number"
        placeholder="Enter your 10-digit mobile number"
        value={mobile}
        onChangeText={setMobile}
        keyboardType="number-pad"
        maxLength={10}
      />
      
      <AppButton
        label="Send OTP"
        onPress={handleLogin}
        loading={loading}
        className="mt-4"
        disabled={mobile.length !== 10}
      />
    </AuthLayout>
  );
};
