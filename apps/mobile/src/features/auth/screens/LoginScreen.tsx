import React, { useState } from 'react';
import { TouchableOpacity } from 'react-native';
import { AppInput, AppButton, AppText } from '@esparex/mobile-ui';
import { AuthLayout } from '../layouts/AuthLayout';
import { useAuth } from '../../../providers/AuthProvider';
import { navigate } from '../../../navigation/navigationRef';
import { ROUTES } from '../../../navigation/routes';

export const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    setLoading(true);
    try {
      await login({ email, password });
    } catch {
      // Login errors are handled via AuthProvider state/toast
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome Back"
      description="Enter your credentials to continue"
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
        label="Email"
        placeholder="Enter your email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <AppInput
        label="Password"
        placeholder="Enter your password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity
        onPress={() => navigate(ROUTES.AUTH_STACK, { screen: ROUTES.FORGOT_PASSWORD })}
        className="self-end mb-2"
        accessibilityRole="button"
        accessibilityLabel="Forgot Password?"
      >
        <AppText variant="caption" className="text-brand-600 dark:text-brand-400 font-semibold">Forgot Password?</AppText>

      </TouchableOpacity>
      
      <AppButton
        label="Login"
        onPress={handleLogin}
        loading={loading}
        className="mt-2"
      />
    </AuthLayout>
  );
};
