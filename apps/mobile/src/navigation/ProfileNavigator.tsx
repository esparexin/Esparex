import React from 'react';
import { createNativeStackNavigator, NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ProfileStackParamList, ROUTES } from './routes';
import { navigate } from './navigationRef';
import { ProfileScreen } from '../features/user/presentation/screens/ProfileScreen';
import { SettingsScreen } from '../features/user/presentation/screens/SettingsScreen';
import { MyListingsScreen } from '../features/listings/presentation/screens/MyListingsScreen';
import { BusinessRegistrationWizardScreen, BusinessStatusScreen, useBusinessProfile } from '../features/business';
import { PlanSelectionScreen, TransactionHistoryScreen } from '../features/payment';
import { SmartAlertsScreen } from '../features/smartAlert';
import { SavedAdsScreen } from '../features/listings/presentation/screens/SavedAdsScreen';
import { EditListingScreen } from '../features/listings/presentation/screens/EditListingScreen';
import { TermsAndPrivacyScreen } from '../features/user/presentation/screens/TermsAndPrivacyScreen';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

type ProfileNavProp = NativeStackNavigationProp<ProfileStackParamList>;

interface WrapperProps {
  navigation: ProfileNavProp;
}

function MyListingsWrapper({ navigation }: WrapperProps) {
  return (
    <MyListingsScreen
      onBack={() => navigation.goBack()}
    />
  );
}

function BusinessRegistrationWrapper({ navigation }: WrapperProps) {
  return (
    <BusinessRegistrationWizardScreen
      onSuccess={() => navigation.navigate(ROUTES.PROFILE_OVERVIEW)}
      onCancel={() => navigation.goBack()}
    />
  );
}

function BusinessStatusWrapper({ navigation }: WrapperProps) {
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

function PlanSelectionWrapper({ navigation }: WrapperProps) {
  return (
    <PlanSelectionScreen
      onSuccess={() => navigation.navigate(ROUTES.PROFILE_OVERVIEW)}
      onBack={() => navigation.goBack()}
    />
  );
}

function TransactionHistoryWrapper({ navigation }: WrapperProps) {
  return (
    <TransactionHistoryScreen
      onBack={() => navigation.goBack()}
    />
  );
}

function SmartAlertsWrapper({ navigation }: WrapperProps) {
  return (
    <SmartAlertsScreen
      onUpgradePlan={() => navigation.navigate(ROUTES.PLAN_SELECTION)}
      onBack={() => navigation.goBack()}
    />
  );
}

function SavedAdsWrapper({ navigation }: WrapperProps) {
  return (
    <SavedAdsScreen
      onPressListing={(id) =>
        navigate(ROUTES.MAIN_STACK, {
          screen: ROUTES.LISTING_DETAILS,
          params: { id },
        })
      }
      onExploreListings={() =>
        navigate(ROUTES.MAIN_STACK, {
          screen: ROUTES.MAIN_TABS,
          params: { screen: ROUTES.SEARCH_TAB },
        })
      }
      onBack={() => navigation.goBack()}
    />
  );
}

export const ProfileNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name={ROUTES.PROFILE_OVERVIEW} component={ProfileScreen} />
    <Stack.Screen name={ROUTES.PROFILE_SETTINGS} component={SettingsScreen} />
    <Stack.Screen name={ROUTES.MY_LISTINGS} component={MyListingsWrapper} />
    <Stack.Screen name={ROUTES.BUSINESS_REGISTRATION} component={BusinessRegistrationWrapper} />
    <Stack.Screen name={ROUTES.BUSINESS_STATUS} component={BusinessStatusWrapper} />
    <Stack.Screen name={ROUTES.PLAN_SELECTION} component={PlanSelectionWrapper} />
    <Stack.Screen name={ROUTES.TRANSACTION_HISTORY} component={TransactionHistoryWrapper} />
    <Stack.Screen name={ROUTES.SMART_ALERTS} component={SmartAlertsWrapper} />
    <Stack.Screen name={ROUTES.SAVED_ADS} component={SavedAdsWrapper} />
    <Stack.Screen name={ROUTES.EDIT_LISTING} component={EditListingScreen} />
    <Stack.Screen name={ROUTES.TERMS_AND_PRIVACY} component={TermsAndPrivacyScreen} />
  </Stack.Navigator>
);
