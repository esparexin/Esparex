import React, { useState, useCallback } from 'react';
import { View, ScrollView, Switch, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen, Container, AppText, Card, AppIcon, AppButton } from '@esparex/mobile-ui';
import { useProfile } from '../hooks/useProfile';
import { useUpdateProfile } from '../hooks/useUpdateProfile';
import { useAuth } from '../../../../providers/AuthProvider';
import { EditProfileModal } from '../components/EditProfileModal';
import { ErrorState } from '../../../common/components/ErrorState';
import { ProfileStackParamList, ROUTES } from '../../../../navigation/routes';

type Props = NativeStackScreenProps<ProfileStackParamList, typeof ROUTES.PROFILE_SETTINGS>;

export const SettingsScreen = ({ navigation }: Props) => {
  const { data: profile, isLoading, isError, refetch } = useProfile();
  const updateProfileMutation = useUpdateProfile();
  const { logout } = useAuth();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(profile?.notificationSettings?.push ?? true);
  const [emailEnabled, setEmailEnabled] = useState(profile?.notificationSettings?.email ?? true);

  const handleUpdateProfile = useCallback(
    (payload: { name?: string; email?: string }) => {
      updateProfileMutation.mutate(payload, {
        onSuccess: () => setIsEditModalOpen(false),
      });
    },
    [updateProfileMutation]
  );

  const handleLogoutPress = useCallback(() => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of your Esparex account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => logout(),
      },
    ]);
  }, [logout]);

  if (isError) {
    return (
      <Screen>
        <ErrorState onRetry={refetch} />
      </Screen>
    );
  }

  return (
    <Screen edges={['top', 'left', 'right']}>
      <Container className="flex-1 bg-slate-50 dark:bg-slate-950">
        {/* Back navigation header */}
        <View className="flex-row items-center px-4 pt-2 pb-1">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            accessibilityLabel="Back to profile"
            accessibilityRole="button"
            className="mr-3 p-1"
          >
            <AppIcon name="ArrowLeft" size={22} color="#0ea5e9" />
          </TouchableOpacity>
          <AppText variant="h2" className="font-bold text-slate-900 dark:text-white">
            Settings
          </AppText>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Account Profile Card */}
          <Card className="p-4 mb-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <View className="flex-row items-center justify-between mb-2">
              <AppText variant="h3" className="font-bold text-slate-900 dark:text-white">
                Account Information
              </AppText>
              <TouchableOpacity
                onPress={() => setIsEditModalOpen(true)}
                className="flex-row items-center bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full"
              >
                <AppIcon name="User" size={14} color="#0ea5e9" />
                <AppText variant="caption" className="font-semibold text-sky-600 dark:text-sky-400 ml-1">
                  Edit
                </AppText>
              </TouchableOpacity>
            </View>

            <View className="py-2 border-b border-slate-100 dark:border-slate-800">
              <AppText variant="caption" className="text-slate-400">
                Name
              </AppText>
              <AppText variant="body" className="font-medium text-slate-800 dark:text-slate-200">
                {profile?.name || 'Not provided'}
              </AppText>
            </View>

            <View className="py-2">
              <AppText variant="caption" className="text-slate-400">
                Email
              </AppText>
              <AppText variant="body" className="font-medium text-slate-800 dark:text-slate-200">
                {profile?.email || 'Not provided'}
              </AppText>
            </View>
          </Card>

          {/* Preferences */}
          <Card className="p-4 mb-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <AppText variant="h3" className="font-bold text-slate-900 dark:text-white mb-3">
              Notification Settings
            </AppText>

            <View className="flex-row items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800">
              <View className="flex-1 mr-4">
                <AppText variant="body" className="font-medium text-slate-800 dark:text-slate-200">
                  Push Notifications
                </AppText>
                <AppText variant="caption" className="text-slate-500">
                  Receive instant chat & listing updates
                </AppText>
              </View>
              <Switch
                value={pushEnabled}
                onValueChange={setPushEnabled}
                trackColor={{ false: '#cbd5e1', true: '#38bdf8' }}
              />
            </View>

            <View className="flex-row items-center justify-between py-3">
              <View className="flex-1 mr-4">
                <AppText variant="body" className="font-medium text-slate-800 dark:text-slate-200">
                  Email Notifications
                </AppText>
                <AppText variant="caption" className="text-slate-500">
                  Receive account digests & promotion alerts
                </AppText>
              </View>
              <Switch
                value={emailEnabled}
                onValueChange={setEmailEnabled}
                trackColor={{ false: '#cbd5e1', true: '#38bdf8' }}
              />
            </View>
          </Card>

          {/* Danger Zone / Logout */}
          <Card className="p-4 mb-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <AppText variant="h3" className="font-bold text-red-500 mb-3">
              Account Actions
            </AppText>
            <AppButton variant="destructive" onPress={handleLogoutPress}>
              Sign Out
            </AppButton>
          </Card>
        </ScrollView>

        <EditProfileModal
          visible={isEditModalOpen}
          user={profile}
          isSaving={updateProfileMutation.isPending}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleUpdateProfile}
        />
      </Container>
    </Screen>
  );
};

const styles = StyleSheet.create({
  // paddingBottom: 100 clears the bottom tab navigation bar (MainTabs height ~60px + safe area)
  scrollContent: { padding: 16, paddingBottom: 100 },
});
