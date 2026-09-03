import React from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen, Container, AppText, Avatar, Card, AppIcon, Badge, AppButton } from '@esparex/mobile-ui';
import { base } from '@esparex/design-tokens';
import { useAuth } from '../../../../providers/AuthProvider';
import { navigate } from '../../../../navigation/navigationRef';
import { useProfile } from '../hooks/useProfile';
import { ErrorState } from '../../../common/components/ErrorState';
import { ProfileStackParamList, ROUTES } from '../../../../navigation/routes';
import { ProfileMenuSection, MenuItem } from '../components/ProfileMenuSection';

type Props = NativeStackScreenProps<ProfileStackParamList, typeof ROUTES.PROFILE_OVERVIEW>;

export const ProfileScreen = ({ navigation }: Props) => {
  const { status: authStatus } = useAuth();
  const { data: profile, isLoading, isError, refetch, isRefetching } = useProfile();

  const isBusinessUser = profile?.userType === 'business' || Boolean(profile?.businessId);

  const activityItems: MenuItem[] = [
    {
      id: 'my-listings',
      label: 'My Ads & Listings',
      subtitle: 'Manage active, pending, and sold ads',
      icon: 'Package',
      onPress: () => navigation.navigate(ROUTES.MY_LISTINGS),
    },
    {
      id: 'saved-ads',
      label: 'Saved Ads & Favorites',
      subtitle: 'Items you have bookmarked',
      icon: 'Heart',
      onPress: () => navigation.navigate(ROUTES.SAVED_ADS),
    },
    {
      id: 'smart-alerts',
      label: 'Smart Search Alerts',
      subtitle: 'Get notified for newly listed items',
      icon: 'Bell',
      onPress: () => navigation.navigate(ROUTES.SMART_ALERTS),
    },
  ];

  const businessAndPlansItems: MenuItem[] = [
    {
      id: 'business-hub',
      label: isBusinessUser ? 'Business Profile & Status' : 'Register as Business',
      subtitle: isBusinessUser ? 'View store profile and verified status' : 'Grow your sales with a verified business account',
      icon: 'Building2',
      onPress: () =>
        navigation.navigate(isBusinessUser ? ROUTES.BUSINESS_STATUS : ROUTES.BUSINESS_REGISTRATION),
    },
    {
      id: 'plans-wallet',
      label: 'Ad Credits & Plans',
      subtitle: 'Top up ad posting balance and featured slots',
      icon: 'CreditCard',
      onPress: () => navigation.navigate(ROUTES.PLAN_SELECTION),
    },
    {
      id: 'transaction-history',
      label: 'Purchase History',
      subtitle: 'View invoices and payment receipts',
      icon: 'FileText',
      onPress: () => navigation.navigate(ROUTES.TRANSACTION_HISTORY),
    },
  ];

  const settingsItems: MenuItem[] = [
    {
      id: 'account-settings',
      label: 'Account Settings',
      subtitle: 'Notification preferences and sign out',
      icon: 'Settings',
      onPress: () => navigation.navigate(ROUTES.PROFILE_SETTINGS),
    },
    {
      id: 'terms-privacy',
      label: 'Terms & Privacy Policy',
      subtitle: 'Legal compliance and user protection',
      icon: 'Shield',
      onPress: () => navigation.navigate(ROUTES.TERMS_AND_PRIVACY),
    },
  ];

  if (authStatus === 'anonymous') {
    return (
      <Screen edges={['top', 'left', 'right']}>
        <Container className="flex-1 bg-slate-50 dark:bg-slate-950 p-4">
          <View className="px-2 pt-2 pb-4">
            <AppText variant="h2" className="font-bold text-slate-900 dark:text-white">
              My Profile
            </AppText>
          </View>

          <Card className="p-6 mb-4 items-center">
            <Avatar fallback="GU" size="lg" className="mb-3" />
            <AppText variant="h2" className="font-bold text-slate-900 dark:text-white text-center">
              Welcome to Esparex
            </AppText>
            <AppText variant="body" className="text-slate-500 dark:text-slate-400 mt-1 text-center mb-5">
              Sign in to manage your listings, view saved items, and access account settings.
            </AppText>
            <AppButton
              label="Sign In / Register"
              onPress={() => navigate(ROUTES.AUTH_STACK)}
              className="w-full"
              accessibilityLabel="Sign in to your account"
            />
          </Card>

          <TouchableOpacity
            onPress={() => navigation.navigate(ROUTES.TERMS_AND_PRIVACY)}
            accessibilityLabel="View terms of service and privacy policy"
            accessibilityRole="button"
          >
            <Card className="p-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <AppIcon name="Shield" size={18} color={base.slate[500]} />
                  <AppText variant="body" className="font-semibold text-slate-800 dark:text-slate-200 ml-2.5">
                    Terms of Service &amp; Privacy Policy
                  </AppText>
                </View>
                <AppIcon name="ChevronRight" size={18} color={base.slate[400]} />
              </View>
            </Card>
          </TouchableOpacity>
        </Container>
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen>
        <ErrorState onRetry={refetch} />
      </Screen>
    );
  }

  if (isLoading && !profile) {
    return (
      <Screen edges={['top', 'left', 'right']}>
        <Container className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={base.brand[500]} />
        </Container>
      </Screen>
    );
  }

  return (
    <Screen edges={['top', 'left', 'right']}>
      <Container className="flex-1 bg-slate-50 dark:bg-slate-950">
        {/* Top Header */}
        <View className="flex-row items-center justify-between px-4 pt-2 pb-1">
          <AppText variant="h2" className="font-bold text-slate-900 dark:text-white">
            My Profile
          </AppText>
          <TouchableOpacity
            onPress={() => navigation.navigate(ROUTES.PROFILE_SETTINGS)}
            accessibilityLabel="Open settings"
            accessibilityRole="button"
            className="p-2"
          >
            <AppIcon name="Settings" size={22} color={base.slate[500]} />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={base.brand[500]} />
          }
          contentContainerStyle={styles.scrollContent}
        >
          {/* User Profile Card */}
          <Card className="p-4 mb-4 flex-row items-center">
            <Avatar
              src={profile?.profilePhoto}
              fallback={profile?.name ? profile.name.substring(0, 2).toUpperCase() : 'US'}
              size="lg"
              className="mr-3.5"
            />
            <View className="flex-1">
              <AppText variant="h3" className="font-bold text-slate-900 dark:text-white">
                {profile?.name || 'Esparex User'}
              </AppText>
              <AppText variant="caption" className="text-slate-500 dark:text-slate-400 mt-0.5">
                {profile?.mobile || profile?.email || 'No contact provided'}
              </AppText>

              <View className="flex-row gap-1.5 mt-2 flex-wrap items-center">
                {profile?.isPhoneVerified && (
                  <View className="flex-row items-center bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                    <AppIcon name="CheckCircle2" size={10} color={base.success} />
                    <AppText variant="caption" className="text-emerald-700 dark:text-emerald-300 font-semibold ml-1 text-tiny">
                      Verified
                    </AppText>
                  </View>
                )}
                {profile?.userType && (
                  <Badge
                    label={profile.userType.toUpperCase()}
                    variant={profile.userType === 'business' ? 'warning' : 'default'}
                  />
                )}
              </View>
            </View>
          </Card>

          {/* Activity Section */}
          <ProfileMenuSection title="My Activity" items={activityItems} />

          {/* Business & Plans Section */}
          <ProfileMenuSection title="Business & Plans" items={businessAndPlansItems} />

          {/* Settings & Legal Section */}
          <ProfileMenuSection title="Preferences & Legal" items={settingsItems} />
        </ScrollView>
      </Container>
    </Screen>
  );
};

const styles = StyleSheet.create({
  scrollContent: { padding: 16, paddingBottom: 100 },
});
