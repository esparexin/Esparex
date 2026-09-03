import React, { useState, useEffect } from 'react';
import { View, ScrollView } from 'react-native';
import { AppText, AppButton, AppInput, AppModalSheet } from '@esparex/mobile-ui';
import { base } from '@esparex/design-tokens';
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
    <AppModalSheet
      visible={visible}
      onClose={onClose}
      title="Edit Profile"
    >
      <ScrollView showsVerticalScrollIndicator={false} className="my-4 gap-4">
        <View className="mb-4">
          <AppText variant="caption" className="font-semibold text-foreground mb-2">
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
          <AppText variant="caption" className="font-semibold text-foreground mb-2">
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
      <View className="flex-row gap-3 pt-3 border-t border-border">
        <AppButton variant="outline" onPress={onClose} label="Cancel" className="flex-1" />
        <AppButton variant="primary" onPress={handleSave} label="Save Changes" loading={isSaving} className="flex-[2] bg-brand-600 hover:bg-brand-700" />
      </View>
    </AppModalSheet>
  );
});

EditProfileModal.displayName = 'EditProfileModal';

