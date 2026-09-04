import React, { useState } from 'react';
import { View, Alert, ScrollView } from 'react-native';
import { AppButton, AppText, AppInput, AppModalSheet } from '@esparex/mobile-ui';
import { SmartAlertFormState, INITIAL_SMART_ALERT_FORM_STATE } from '../../domain/SmartAlertFormState';
import { useCreateSmartAlert } from '../hooks/useCreateSmartAlert';
import { SmartAlert } from '../../domain/SmartAlert';

interface CreateSmartAlertModalProps {
  visible: boolean;
  onClose: () => void;
  initialAlert?: SmartAlert | null;
  onQuotaExceeded?: () => void;
}

export function CreateSmartAlertModal({
  visible,
  onClose,
  initialAlert,
  onQuotaExceeded,
}: CreateSmartAlertModalProps) {
  const [formState, setFormState] = useState<SmartAlertFormState>(INITIAL_SMART_ALERT_FORM_STATE);
  const createMutation = useCreateSmartAlert();

  React.useEffect(() => {
    if (initialAlert) {
      setFormState({
        name: initialAlert.name || '',
        keywords: initialAlert.criteria?.keywords || '',
        category: initialAlert.criteria?.category || '',
        minPrice: initialAlert.criteria?.minPrice ? String(initialAlert.criteria.minPrice) : '',
        maxPrice: initialAlert.criteria?.maxPrice ? String(initialAlert.criteria.maxPrice) : '',
        location: initialAlert.criteria?.location || '',
        radiusKm: initialAlert.radiusKm || 25,
        frequency: initialAlert.frequency || 'instant',
      });
    } else {
      setFormState(INITIAL_SMART_ALERT_FORM_STATE);
    }
  }, [initialAlert, visible]);

  const handleSubmit = () => {
    if (!formState.name.trim() && !formState.keywords.trim() && !formState.category.trim()) {
      Alert.alert('Validation Error', 'Please specify an alert name, search keyword, or category.');
      return;
    }

    if (formState.minPrice && formState.maxPrice) {
      const minP = parseFloat(formState.minPrice);
      const maxP = parseFloat(formState.maxPrice);
      if (maxP < minP) {
        Alert.alert('Validation Error', 'Maximum price must be greater than or equal to minimum price.');
        return;
      }
    }

    createMutation.mutate(formState, {
      onSuccess: () => {
        Alert.alert('Smart Alert Created', 'You will receive instant push notifications when matching ads are posted.');
        onClose();
      },
      onError: (err: unknown) => {
        const errorObj = err as { response?: { status?: number }; message?: string };
        if (errorObj?.response?.status === 403 || errorObj?.message?.includes('SMART_ALERT_LIMIT_EXCEEDED')) {
          Alert.alert(
            'Alert Limit Reached',
            'You have reached your smart alert quota limit. Upgrade your credit plan to create more alerts.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Upgrade Plan', onPress: () => onQuotaExceeded && onQuotaExceeded() },
            ]
          );
        } else {
          Alert.alert('Creation Failed', errorObj?.message || 'Unable to create smart alert. Please try again.');
        }
      },
    });
  };

  return (
    <AppModalSheet
      visible={visible}
      onClose={onClose}
      title={initialAlert ? 'Edit Smart Alert' : 'Create Smart Alert'}
    >
      <ScrollView className="my-4" showsVerticalScrollIndicator={false}>
        <View className="mb-3.5">
          <AppInput
            label="Alert Label *"
            placeholder="e.g. iPhone 13 in Mumbai"
            value={formState.name}
            onChangeText={(text) => setFormState((prev) => ({ ...prev, name: text }))}
            accessibilityLabel="Alert label input"
          />
        </View>

        <View className="mb-3.5">
          <AppInput
            label="Search Keyword"
            placeholder="e.g. OLED TV, Royal Enfield"
            value={formState.keywords}
            onChangeText={(text) => setFormState((prev) => ({ ...prev, keywords: text }))}
            accessibilityLabel="Search keyword input"
          />
        </View>

        <View className="mb-3.5">
          <AppInput
            label="Category"
            placeholder="e.g. Mobile Phones, Electronics"
            value={formState.category}
            onChangeText={(text) => setFormState((prev) => ({ ...prev, category: text }))}
            accessibilityLabel="Category input"
          />
        </View>

        <View className="flex-row justify-between mb-3.5">
          <View className="w-[48%]">
            <AppInput
              label="Min Price (₹)"
              placeholder="Min"
              keyboardType="numeric"
              value={formState.minPrice}
              onChangeText={(text) => setFormState((prev) => ({ ...prev, minPrice: text }))}
              accessibilityLabel="Minimum price input"
            />
          </View>

          <View className="w-[48%]">
            <AppInput
              label="Max Price (₹)"
              placeholder="Max"
              keyboardType="numeric"
              value={formState.maxPrice}
              onChangeText={(text) => setFormState((prev) => ({ ...prev, maxPrice: text }))}
              accessibilityLabel="Maximum price input"
            />
          </View>
        </View>

        <View className="mb-3.5">
          <AppInput
            label="Location / City"
            placeholder="e.g. Mumbai, New Delhi"
            value={formState.location}
            onChangeText={(text) => setFormState((prev) => ({ ...prev, location: text }))}
            accessibilityLabel="Location input"
          />
        </View>
      </ScrollView>

      <View className="pt-2 border-t border-border">
        <AppButton
          label={createMutation.isPending ? 'Saving...' : 'Save Smart Alert'}
          onPress={handleSubmit}
          disabled={createMutation.isPending}
          loading={createMutation.isPending}
          accessibilityLabel="Save smart alert"
        />
      </View>
    </AppModalSheet>
  );
}
