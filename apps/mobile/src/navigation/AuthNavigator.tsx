import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthStackParamList, ROUTES } from './routes';
import { LoginScreen } from '../features/auth/screens/LoginScreen';
import { OTPScreen } from '../features/auth/screens/OTPScreen';
import { TermsAndPrivacyScreen } from '../features/user/presentation/screens/TermsAndPrivacyScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export const AuthNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name={ROUTES.LOGIN} component={LoginScreen} />
      <Stack.Screen name={ROUTES.OTP} component={OTPScreen} />
      <Stack.Screen name={ROUTES.TERMS_AND_PRIVACY} component={TermsAndPrivacyScreen} />
    </Stack.Navigator>
  );
};
