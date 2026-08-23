import React, { useState } from 'react';
import { View, Modal, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { AppText, AppIcon, AppButton } from '@esparex/mobile-ui';
import { REPORT_REASON, ReportReasonValue } from '@esparex/contracts';
import { services } from '../../../../../bootstrap';

interface ReportAdModalProps {
  visible: boolean;
  adId: string;
  adTitle: string;
  onClose: () => void;
}

const REPORT_REASONS: Array<{ label: string; value: ReportReasonValue }> = [
  { label: 'Fraudulent or Scam', value: REPORT_REASON.SCAM },
  { label: 'Inappropriate Content', value: REPORT_REASON.OFFENSIVE_CONTENT },
  { label: 'Spam', value: REPORT_REASON.SPAM },
  { label: 'Prohibited Item', value: REPORT_REASON.PROHIBITED_ITEM },
  { label: 'Misleading Information', value: REPORT_REASON.MISLEADING_INFO },
  { label: 'Sold Item Still Listed', value: REPORT_REASON.SOLD_ELSEWHERE },
  { label: 'Other', value: REPORT_REASON.OTHER },
];

export const ReportAdModal = ({ visible, adId, adTitle, onClose }: ReportAdModalProps) => {
  const [selectedReason, setSelectedReason] = useState<ReportReasonValue | null>(null);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedReason) {
      Alert.alert('Required', 'Please select a reason for reporting this listing.');
      return;
    }

    setIsSubmitting(true);
    try {
      await services.listingService.reportListing(adId, selectedReason, description.trim() || undefined);
      Alert.alert('Report Submitted', 'Thank you. Our moderation team will review this listing.', [
        {
          text: 'OK',
          onPress: () => {
            setSelectedReason(null);
            setDescription('');
            onClose();
          },
        },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Unable to submit report at this time. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/60 justify-end">
        <View className="bg-white dark:bg-slate-900 rounded-t-3xl p-5 max-h-[85%]">
          {/* Header */}
          <View className="flex-row items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
            <View className="flex-row items-center flex-1 mr-2">
              <View className="mr-2">
                <AppIcon name="AlertTriangle" size={20} color="#ef4444" />
              </View>
              <AppText variant="h3" className="text-slate-900 dark:text-white font-bold" numberOfLines={1}>
                Report Listing
              </AppText>
            </View>
            <TouchableOpacity
              onPress={onClose}
              disabled={isSubmitting}
              className="p-1 rounded-full bg-slate-100 dark:bg-slate-800"
              accessibilityRole="button"
              accessibilityLabel="Close report dialog"
            >
              <AppIcon name="X" size={18} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <AppText variant="caption" className="text-slate-500 dark:text-slate-400 mb-3">
              Why are you reporting &quot;{adTitle}&quot;?
            </AppText>

            {/* Reasons list */}
            <View className="space-y-2 mb-4">
              {REPORT_REASONS.map((item) => {
                const isSelected = selectedReason === item.value;
                return (
                  <TouchableOpacity
                    key={item.value}
                    onPress={() => setSelectedReason(item.value)}
                    activeOpacity={0.7}
                    className={`p-3 rounded-xl border flex-row items-center justify-between mb-1.5 ${
                      isSelected
                        ? 'border-sky-600 bg-sky-50 dark:bg-sky-950/40'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60'
                    }`}
                  >
                    <AppText
                      variant="body"
                      className={`text-sm font-medium ${
                        isSelected
                          ? 'text-sky-700 dark:text-sky-300 font-semibold'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {item.label}
                    </AppText>
                    <View
                      className={`w-4 h-4 rounded-full border items-center justify-center ${
                        isSelected ? 'border-sky-600 bg-sky-600' : 'border-slate-400'
                      }`}
                    >
                      {isSelected && <View className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Additional details */}
            <AppText variant="caption" className="text-slate-600 dark:text-slate-300 font-semibold mb-1.5">
              Additional Details (Optional)
            </AppText>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Provide details to help us investigate..."
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={3}
              className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm min-h-[72px] text-top mb-5"
            />

            {/* Action buttons */}
            <View className="flex-row gap-3 pb-4">
              <View className="flex-1">
                <AppButton
                  variant="outline"
                  label="Cancel"
                  onPress={onClose}
                  disabled={isSubmitting}
                />
              </View>
              <View className="flex-1">
                <AppButton
                  variant="primary"
                  label={isSubmitting ? 'Submitting...' : 'Submit Report'}
                  onPress={handleSubmit}
                  disabled={isSubmitting || !selectedReason}
                />
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
