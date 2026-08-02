import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProfileStackParamList, ROUTES } from './routes';
import { ProfileScreen } from '../features/user/presentation/screens/ProfileScreen';
import { SettingsScreen } from '../features/user/presentation/screens/SettingsScreen';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

// ---------------------------------------------------------------------------
// ProfileNavigator — nested stack inside the Profile tab.
//
// PROFILE_OVERVIEW → PROFILE_SETTINGS (accessible via the Settings card)
// ---------------------------------------------------------------------------

export const ProfileNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name={ROUTES.PROFILE_OVERVIEW} component={ProfileScreen} />
    <Stack.Screen name={ROUTES.PROFILE_SETTINGS} component={SettingsScreen} />
  </Stack.Navigator>
);
