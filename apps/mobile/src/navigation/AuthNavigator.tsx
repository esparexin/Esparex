import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthStackParamList, ROUTES } from './routes';
import { Center } from '@esparex/mobile-ui';
import { LoginScreen } from '../features/auth/screens/LoginScreen';
import { OTPScreen } from '../features/auth/screens/OTPScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export const AuthNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name={ROUTES.LOGIN} component={LoginScreen} />
      <Stack.Screen name={ROUTES.OTP} component={OTPScreen} />
    </Stack.Navigator>
  );
};
