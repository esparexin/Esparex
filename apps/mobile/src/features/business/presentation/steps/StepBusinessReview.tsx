import React from 'react';
import { View } from 'react-native';
import { Container, Card, AppText } from '@esparex/mobile-ui';
import { BusinessFormState } from '../../domain/BusinessFormState';

interface StepBusinessReviewProps {
  formState: BusinessFormState;
}

export function StepBusinessReview({ formState }: StepBusinessReviewProps) {
  return (
    <Container className="p-4">
      <Card className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <AppText variant="h3" className="font-bold text-slate-900 dark:text-slate-100 mb-1">
          Review & Submit Application
        </AppText>
        <AppText variant="caption" className="text-slate-500 dark:text-slate-400 mb-4">
          Verify your information before submitting for verification
        </AppText>

        <View className="mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <AppText variant="body" className="font-bold text-slate-900 dark:text-slate-100 mb-1.5 text-sm">
            Business Details
          </AppText>
          <AppText variant="caption" className="text-slate-600 dark:text-slate-400 mb-1">
            <AppText variant="caption" className="font-semibold text-slate-700 dark:text-slate-300">Name: </AppText>
            {formState.name}
          </AppText>
          <AppText variant="caption" className="text-slate-600 dark:text-slate-400 mb-1">
            <AppText variant="caption" className="font-semibold text-slate-700 dark:text-slate-300">Type: </AppText>
            {formState.businessType}
          </AppText>
          <AppText variant="caption" className="text-slate-600 dark:text-slate-400 mb-1">
            <AppText variant="caption" className="font-semibold text-slate-700 dark:text-slate-300">Mobile: </AppText>
            {formState.mobile}
          </AppText>
          <AppText variant="caption" className="text-slate-600 dark:text-slate-400 mb-1">
            <AppText variant="caption" className="font-semibold text-slate-700 dark:text-slate-300">Email: </AppText>
            {formState.email}
          </AppText>
        </View>

        <View className="mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <AppText variant="body" className="font-bold text-slate-900 dark:text-slate-100 mb-1.5 text-sm">
            Shop Address
          </AppText>
          <AppText variant="caption" className="text-slate-600 dark:text-slate-400">
            {formState.address}, {formState.city}, {formState.state} - {formState.pincode}
          </AppText>
        </View>

        <View className="mb-2 pb-2">
          <AppText variant="body" className="font-bold text-slate-900 dark:text-slate-100 mb-1.5 text-sm">
            Attached Verification Documents
          </AppText>
          <AppText variant="caption" className="text-slate-600 dark:text-slate-400">
            {formState.documents.length} document(s) uploaded
          </AppText>
        </View>
      </Card>
    </Container>
  );
}

