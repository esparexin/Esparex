import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProfileStackParamList, ROUTES } from './routes';
import { ProfileScreen } from '../features/user/presentation/screens/ProfileScreen';
import { SettingsScreen } from '../features/user/presentation/screens/SettingsScreen';
import { BusinessRegistrationWizardScreen, BusinessStatusScreen, useBusinessProfile } from '../features/business';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

function BusinessRegistrationWrapper({ navigation }: any) {
  return (
    <BusinessRegistrationWizardScreen
      onSuccess={() => navigation.navigate(ROUTES.PROFILE_OVERVIEW)}
      onCancel={() => navigation.goBack()}
    />
  );
}

function BusinessStatusWrapper({ navigation }: any) {
  const { data: business } = useBusinessProfile();
  if (!business) {
    return (
      <BusinessRegistrationWizardScreen
        onSuccess={() => navigation.navigate(ROUTES.PROFILE_OVERVIEW)}
        onCancel={() => navigation.goBack()}
      />
    );
  }
  return (
    <BusinessStatusScreen
      business={business}
      onEdit={() => navigation.navigate(ROUTES.BUSINESS_REGISTRATION)}
      onBack={() => navigation.goBack()}
    />
  );
}

export const ProfileNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name={ROUTES.PROFILE_OVERVIEW} component={ProfileScreen} />
    <Stack.Screen name={ROUTES.PROFILE_SETTINGS} component={SettingsScreen} />
    <Stack.Screen name={ROUTES.BUSINESS_REGISTRATION} component={BusinessRegistrationWrapper} />
    <Stack.Screen name={ROUTES.BUSINESS_STATUS} component={BusinessStatusWrapper} />
  </Stack.Navigator>
);
