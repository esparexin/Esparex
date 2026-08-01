import React, { useState } from 'react';
import { TouchableOpacity } from 'react-native';
import { AppInput, AppButton, AppText } from '@esparex/mobile-ui';
import { AuthLayout } from '../layouts/AuthLayout';
import { navigate } from '../../../navigation/navigationRef';
import { ROUTES } from '../../../navigation/routes';

export const ForgotPasswordScreen = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSendLink = async () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSent(true);
    }, 1000);
  };

  return (
    <AuthLayout
      title="Reset Password"
      description={sent ? "Check your email for the reset link" : "Enter your email to receive a reset link"}
      footer={
        <TouchableOpacity onPress={() => navigate(ROUTES.AUTH_STACK, { screen: ROUTES.LOGIN })}>
          <AppText variant="body" className="text-sky-500 font-semibold">
            Back to Login
          </AppText>
        </TouchableOpacity>
      }
    >
      {!sent ? (
        <>
          <AppInput
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <AppButton
            label="Send Reset Link"
            onPress={handleSendLink}
            loading={loading}
            className="mt-4"
          />
        </>
      ) : (
        <AppButton
          label="Resend Link"
          onPress={handleSendLink}
          variant="outline"
          loading={loading}
          className="mt-4"
        />
      )}
    </AuthLayout>
  );
};
