import React, { useState } from 'react';
import { View, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { AppText, AppButton, AppModalSheet } from '@esparex/mobile-ui';
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
    <AppModalSheet
      visible={visible}
      onClose={onClose}
      title="Report Listing"
    >
      <ScrollView showsVerticalScrollIndicator={false}>
            <AppText variant="caption" className="text-foreground-secondary mb-3">
              Why are you reporting &quot;{adTitle}&quot;?
            </AppText>

            {/* Reasons list */}
            <View className="gap-2 mb-4">
              {REPORT_REASONS.map((item) => {
                const isSelected = selectedReason === item.value;
                return (
                  <TouchableOpacity
                    key={item.value}
                    onPress={() => setSelectedReason(item.value)}
                    activeOpacity={0.7}
                    className={`p-3 rounded-xl border flex-row items-center justify-between mb-1.5 ${
                      isSelected
                        ? 'border-brand-600 bg-brand-50 dark:bg-brand-950/40'
                        : 'border-border bg-muted'
                    }`}
                  >
                    <AppText
                      variant="body"
                      className={`font-medium ${
                        isSelected
                          ? 'text-brand-600 dark:text-brand-400 font-semibold'
                          : 'text-foreground'
                      }`}
                    >
                      {item.label}
                    </AppText>
                    <View
                      className={`w-4 h-4 rounded-full border items-center justify-center ${
                        isSelected ? 'border-brand-600 bg-brand-600' : 'border-border'
                      }`}
                    >
                      {isSelected && <View className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Additional details */}
            <AppText variant="caption" className="text-foreground font-semibold mb-1.5">
              Additional Details (Optional)
            </AppText>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Provide details to help us investigate..."
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={3}
              className="p-3 bg-muted border border-border rounded-xl text-foreground text-body-lg min-h-[72px] text-top mb-5"
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
    </AppModalSheet>
  );
};
