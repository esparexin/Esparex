import React, { useState } from 'react';
import { Modal, View, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { AppButton, AppText } from '@esparex/mobile-ui';
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
      onError: (err: any) => {
        if (err?.response?.status === 403 || err?.message?.includes('SMART_ALERT_LIMIT_EXCEEDED')) {
          Alert.alert(
            'Alert Limit Reached',
            'You have reached your smart alert quota limit. Upgrade your credit plan to create more alerts.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Upgrade Plan', onPress: () => onQuotaExceeded && onQuotaExceeded() },
            ]
          );
        } else {
          Alert.alert('Creation Failed', err?.message || 'Unable to create smart alert. Please try again.');
        }
      },
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
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white dark:bg-slate-900 rounded-t-3xl p-5 max-h-[85%] border-t border-slate-200 dark:border-slate-800">
          <View className="flex-row justify-between items-center mb-4">
            <AppText variant="h3" className="font-bold text-slate-900 dark:text-slate-100">
              {initialAlert ? 'Edit Smart Alert' : 'Create Smart Alert'}
            </AppText>
            <TouchableOpacity
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close smart alert dialog"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <AppText variant="body" className="font-semibold text-slate-500 dark:text-slate-400 text-lg">
                ✕
              </AppText>
            </TouchableOpacity>
          </View>

          <ScrollView className="mb-4" showsVerticalScrollIndicator={false}>
            <View className="mb-3.5">
              <AppText variant="caption" className="font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Alert Label *
              </AppText>
              <TextInput
                className="border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-base text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-950"
                placeholder="e.g. iPhone 13 in Mumbai"
                placeholderTextColor="#94a3b8"
                value={formState.name}
                onChangeText={(text) => setFormState((prev) => ({ ...prev, name: text }))}
              />
            </View>

            <View className="mb-3.5">
              <AppText variant="caption" className="font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Search Keyword
              </AppText>
              <TextInput
                className="border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-base text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-950"
                placeholder="e.g. OLED TV, Royal Enfield"
                placeholderTextColor="#94a3b8"
                value={formState.keywords}
                onChangeText={(text) => setFormState((prev) => ({ ...prev, keywords: text }))}
              />
            </View>

            <View className="mb-3.5">
              <AppText variant="caption" className="font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Category
              </AppText>
              <TextInput
                className="border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-base text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-950"
                placeholder="e.g. Mobile Phones, Electronics"
                placeholderTextColor="#94a3b8"
                value={formState.category}
                onChangeText={(text) => setFormState((prev) => ({ ...prev, category: text }))}
              />
            </View>

            <View className="flex-row justify-between mb-3.5">
              <View className="w-[48%]">
                <AppText variant="caption" className="font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Min Price (₹)
                </AppText>
                <TextInput
                  className="border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-base text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-950"
                  placeholder="Min"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                  value={formState.minPrice}
                  onChangeText={(text) => setFormState((prev) => ({ ...prev, minPrice: text }))}
                />
              </View>

              <View className="w-[48%]">
                <AppText variant="caption" className="font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Max Price (₹)
                </AppText>
                <TextInput
                  className="border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-base text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-950"
                  placeholder="Max"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                  value={formState.maxPrice}
                  onChangeText={(text) => setFormState((prev) => ({ ...prev, maxPrice: text }))}
                />
              </View>
            </View>

            <View className="mb-3.5">
              <AppText variant="caption" className="font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Location / City
              </AppText>
              <TextInput
                className="border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-base text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-950"
                placeholder="e.g. Mumbai, New Delhi"
                placeholderTextColor="#94a3b8"
                value={formState.location}
                onChangeText={(text) => setFormState((prev) => ({ ...prev, location: text }))}
              />
            </View>
          </ScrollView>

          <View className="pt-2">
            <AppButton
              label={createMutation.isPending ? 'Saving...' : 'Save Smart Alert'}
              onPress={handleSubmit}
              disabled={createMutation.isPending}
              className="bg-brand-600 hover:bg-brand-700"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

