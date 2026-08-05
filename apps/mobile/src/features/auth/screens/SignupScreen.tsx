import React, { useState } from 'react';
import { TouchableOpacity } from 'react-native';
import { AppInput, AppButton, AppText } from '@esparex/mobile-ui';
import { AuthLayout } from '../layouts/AuthLayout';
import { navigate } from '../../../navigation/navigationRef';
import { ROUTES } from '../../../navigation/routes';

export const SignupScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate(ROUTES.AUTH_STACK, { screen: ROUTES.OTP });
    }, 1000);
  };

  return (
    <AuthLayout
      title="Create Account"
      description="Sign up to get started"
      footer={
        <TouchableOpacity
          onPress={() => navigate(ROUTES.AUTH_STACK, { screen: ROUTES.LOGIN })}
          accessibilityRole="button"
          accessibilityLabel="Already have an account? Login"
        >
          <AppText variant="body" className="text-slate-500">
            Already have an account? <AppText className="text-sky-500 font-semibold">Login</AppText>
          </AppText>
        </TouchableOpacity>
      }
    >
      <AppInput
        label="Email"
        placeholder="Enter your email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <AppInput
        label="Password"
        placeholder="Create a password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      
      <AppButton
        label="Sign Up"
        onPress={handleSignup}
        loading={loading}
        className="mt-4"
      />
    </AuthLayout>
  );
};
