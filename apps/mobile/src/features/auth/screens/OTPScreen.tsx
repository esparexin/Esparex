import React, { useState } from 'react';
import { TouchableOpacity } from 'react-native';
import { AppInput, AppButton, AppText } from '@esparex/mobile-ui';
import { AuthLayout } from '../layouts/AuthLayout';
import { useAuth } from '../../../providers/AuthProvider';
import { navigate } from '../../../navigation/navigationRef';
import { ROUTES } from '../../../navigation/routes';

export const OTPScreen = () => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleVerify = async () => {
    setLoading(true);
    try {
      await login({ otp: code });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Verify Account"
      description="Enter the 6-digit code sent to your email"
      footer={
        <TouchableOpacity
          onPress={() => navigate(ROUTES.AUTH_STACK, { screen: ROUTES.LOGIN })}
          accessibilityRole="button"
          accessibilityLabel="Back to Login"
        >
          <AppText variant="body" className="text-slate-500">
            Back to <AppText className="text-sky-500 font-semibold">Login</AppText>
          </AppText>
        </TouchableOpacity>
      }
    >
      <AppInput
        label="Verification Code"
        placeholder="000000"
        value={code}
        onChangeText={setCode}
        keyboardType="number-pad"
        maxLength={6}
      />
      
      <AppButton
        label="Verify"
        onPress={handleVerify}
        loading={loading}
        className="mt-4"
      />
    </AuthLayout>
  );
};
