import React, { useState, useEffect } from 'react';
import { Modal, View, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { AppText, AppButton, AppInput, AppIcon } from '@esparex/mobile-ui';
import { User } from '@esparex/contracts';

interface EditProfileModalProps {
  visible: boolean;
  user?: User;
  isSaving: boolean;
  onClose: () => void;
  onSave: (payload: { name?: string; email?: string }) => void;
}

export const EditProfileModal = React.memo<EditProfileModalProps>(({
  visible,
  user,
  isSaving,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const handleSave = () => {
    onSave({
      name: name.trim() || undefined,
      email: email.trim() || undefined,
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      accessibilityViewIsModal={true}
    >
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-white dark:bg-slate-900 rounded-t-3xl p-6 max-h-[85%]">
          {/* Header */}
          <View className="flex-row items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
            <AppText variant="h3" className="font-bold text-slate-900 dark:text-white">
              Edit Profile
            </AppText>
            <TouchableOpacity
              onPress={onClose}
              accessibilityLabel="Close edit modal"
              accessibilityRole="button"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <AppIcon name="X" size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} className="my-4 space-y-4">
            <View className="mb-4">
              <AppText variant="caption" className="font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Full Name
              </AppText>
              <AppInput
                placeholder="Enter full name"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>

            <View className="mb-4">
              <AppText variant="caption" className="font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Email Address
              </AppText>
              <AppInput
                placeholder="Enter email address"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </ScrollView>

          {/* Actions */}
          <View className="flex-row gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <AppButton variant="outline" onPress={onClose} label="Cancel" style={styles.cancelButton} />
            <AppButton variant="primary" onPress={handleSave} label="Save Changes" loading={isSaving} style={styles.saveButton} />
          </View>
        </View>
      </View>
    </Modal>
  );
});

EditProfileModal.displayName = 'EditProfileModal';

const styles = StyleSheet.create({
  cancelButton: { flex: 1 },
  saveButton: { flex: 2 },
});
