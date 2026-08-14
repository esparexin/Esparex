import React, { useState } from 'react';
import { TouchableOpacity } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { AppInput, AppButton, AppText } from '@esparex/mobile-ui';
import { AuthLayout } from '../layouts/AuthLayout';
import { useAuth } from '../../../providers/AuthProvider';
import { navigate } from '../../../navigation/navigationRef';
import { AuthStackParamList, ROUTES } from '../../../navigation/routes';

export const OTPScreen = () => {
  const route = useRoute<RouteProp<AuthStackParamList, typeof ROUTES.OTP>>();
  const mobile = route.params?.mobile || '';
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { verifyOtp } = useAuth();

  const handleVerify = async () => {
    if (!mobile || code.length !== 6) return;
    setLoading(true);
    try {
      await verifyOtp(mobile, code);
    } catch {
      // OTP verification errors handled via AuthProvider / API client
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Verify Account"
      description={`Enter the 6-digit code sent to ${mobile || 'your mobile'}`}
      footer={
        <TouchableOpacity
          onPress={() => navigate(ROUTES.AUTH_STACK, { screen: ROUTES.LOGIN })}
          accessibilityRole="button"
          accessibilityLabel="Back to Login"
        >
          <AppText variant="body" className="text-slate-500">
            Back to <AppText className="text-brand-600 dark:text-brand-400 font-semibold">Login</AppText>
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
        disabled={code.length !== 6}
      />
    </AuthLayout>
  );
};
