import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProfileStackParamList, ROUTES } from './routes';
import { ProfileScreen } from '../features/user/presentation/screens/ProfileScreen';
import { SettingsScreen } from '../features/user/presentation/screens/SettingsScreen';
import { BusinessRegistrationWizardScreen, BusinessStatusScreen, useBusinessProfile } from '../features/business';
import { PlanSelectionScreen, TransactionHistoryScreen } from '../features/payment';
import { SmartAlertsScreen } from '../features/smartAlert';
import { SavedAdsScreen } from '../features/listings/presentation/screens/SavedAdsScreen';
import { EditListingScreen } from '../features/listings/presentation/screens/EditListingScreen';
import { TermsAndPrivacyScreen } from '../features/user/presentation/screens/TermsAndPrivacyScreen';

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

function SmartAlertsWrapper({ navigation }: any) {
  return (
    <SmartAlertsScreen
      onUpgradePlan={() => navigation.navigate(ROUTES.PLAN_SELECTION)}
    />
  );
}

function SavedAdsWrapper({ navigation }: any) {
  return (
    <SavedAdsScreen
      onPressListing={(id) => navigation.navigate(ROUTES.LISTING_DETAILS, { id })}
      onExploreListings={() => navigation.navigate(ROUTES.SEARCH_TAB)}
    />
  );
}

export const ProfileNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name={ROUTES.PROFILE_OVERVIEW} component={ProfileScreen} />
    <Stack.Screen name={ROUTES.PROFILE_SETTINGS} component={SettingsScreen} />
    <Stack.Screen name={ROUTES.BUSINESS_REGISTRATION} component={BusinessRegistrationWrapper} />
    <Stack.Screen name={ROUTES.BUSINESS_STATUS} component={BusinessStatusWrapper} />
    <Stack.Screen name={ROUTES.PLAN_SELECTION} component={PlanSelectionScreen} />
    <Stack.Screen name={ROUTES.TRANSACTION_HISTORY} component={TransactionHistoryScreen} />
    <Stack.Screen name={ROUTES.SMART_ALERTS} component={SmartAlertsWrapper} />
    <Stack.Screen name={ROUTES.SAVED_ADS} component={SavedAdsWrapper} />
    <Stack.Screen name={ROUTES.EDIT_LISTING} component={EditListingScreen} />
    <Stack.Screen name={ROUTES.TERMS_AND_PRIVACY} component={TermsAndPrivacyScreen} />
  </Stack.Navigator>
);
