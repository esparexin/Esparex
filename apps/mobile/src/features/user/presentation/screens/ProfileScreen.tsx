import React, { useCallback } from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen, Container, AppText, Avatar, Card, AppIcon, Badge } from '@esparex/mobile-ui';
import { base } from '@esparex/design-tokens';
import { useProfile } from '../hooks/useProfile';
import { ErrorState } from '../../../common/components/ErrorState';
import { ProfileStackParamList, ROUTES } from '../../../../navigation/routes';

type Props = NativeStackScreenProps<ProfileStackParamList, typeof ROUTES.PROFILE_OVERVIEW>;

export const ProfileScreen = ({ navigation }: Props) => {
  const { data: profile, isLoading, isError, refetch, isRefetching } = useProfile();

  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      })
    : undefined;

  const handleSettingsPress = useCallback(() => {
    navigation.navigate(ROUTES.PROFILE_SETTINGS);
  }, [navigation]);

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
        {/* Top-bar with Settings shortcut */}
        <View className="flex-row items-center justify-between px-4 pt-2 pb-1">
          <AppText variant="h2" className="font-bold text-slate-900 dark:text-white">
            My Profile
          </AppText>
          <TouchableOpacity
            onPress={handleSettingsPress}
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
          {/* Main User Card */}
          <Card className="p-5 mb-4 items-center">
            <Avatar
              src={profile?.profilePhoto}
              fallback={profile?.name ? profile.name.substring(0, 2).toUpperCase() : 'US'}
              size="lg"
              className="mb-3"
            />
            <AppText variant="h2" className="font-bold text-slate-900 dark:text-white text-center">
              {profile?.name || 'Esparex User'}
            </AppText>
            <AppText variant="body" className="text-slate-500 dark:text-slate-400 mt-0.5 text-center">
              {profile?.mobile || profile?.email || 'No contact provided'}
            </AppText>

            {/* Verification Status Badges */}
            <View className="flex-row gap-2 mt-3 flex-wrap justify-center">
              {profile?.isPhoneVerified && (
                <View className="flex-row items-center bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                  <AppIcon name="CheckCircle2" size={12} color={base.success} />
                  <AppText variant="caption" className="text-emerald-700 dark:text-emerald-300 font-semibold ml-1">
                    Phone Verified
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
          </Card>

          {/* User Details & Location */}
          <Card className="p-4 mb-4">
            <AppText variant="h4" className="font-semibold text-slate-900 dark:text-white mb-3">
              Account Details
            </AppText>

            {memberSince && (
              <View className="flex-row items-center py-2 border-b border-slate-100 dark:border-slate-800">
                <AppIcon name="Calendar" size={16} color={base.slate[500]} />
                <AppText variant="body" className="text-slate-600 dark:text-slate-400 ml-2.5">
                  Member since {memberSince}
                </AppText>
              </View>
            )}

            {profile?.location?.city && (
              <View className="flex-row items-center py-2 border-b border-slate-100 dark:border-slate-800">
                <AppIcon name="MapPin" size={16} color={base.slate[500]} />
                <AppText variant="body" className="text-slate-600 dark:text-slate-400 ml-2.5">
                  {profile.location.city}
                  {profile.location.state ? `, ${profile.location.state}` : ''}
                </AppText>
              </View>
            )}

            <View className="flex-row items-center py-2">
              <AppIcon name="Shield" size={16} color={base.slate[500]} />
              <AppText variant="body" className="text-slate-600 dark:text-slate-400 ml-2.5">
                Account Status: {profile?.status || 'Active'}
              </AppText>
            </View>
          </Card>

          {/* Settings shortcut card */}
          <TouchableOpacity
            onPress={handleSettingsPress}
            accessibilityLabel="Go to account settings"
            accessibilityRole="button"
          >
            <Card className="p-4 mb-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <AppIcon name="Settings" size={18} color={base.slate[500]} />
                  <AppText variant="body" className="font-semibold text-slate-800 dark:text-slate-200 ml-2.5">
                    Account Settings
                  </AppText>
                </View>
                <AppIcon name="ChevronRight" size={18} color={base.slate[400]} />
              </View>
            </Card>
          </TouchableOpacity>
        </ScrollView>
      </Container>
    </Screen>
  );
};

const styles = StyleSheet.create({
  // paddingBottom: 100 clears the bottom tab navigation bar (MainTabs height ~60px + safe area)
  scrollContent: { padding: 16, paddingBottom: 100 },
});

